import * as vscode from 'vscode';

interface LineHistory {
    undoStack: string[];
    redoStack: string[];
    currentSnapshot: string;
}

// We store history as: Map<FileName, Map<LineNumber, HistoryObj>>
const history = new Map<string, Map<number, LineHistory>>();

let isProgrammatic = false;
let debounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Ghost Line 👻 ACTIVE');

    context.subscriptions.push(
        // Listen to text changes (typing, pasting, deleting lines)
        vscode.workspace.onDidChangeTextDocument(onDocumentChange),
        
        // Listen to cursor moves (to init history for new lines we land on)
        vscode.window.onDidChangeTextEditorSelection(onSelectionChange),

        // Commands
        vscode.commands.registerCommand('line-undo.undo', () => restore('undo')),
        vscode.commands.registerCommand('line-undo.redo', () => restore('redo'))
    );
}

/**
 * 1. Handle Text Changes
 * - First: Adjust line numbers in our Map if lines were added/removed.
 * - Second: Debounce and save the new state of the modified line.
 */
function onDocumentChange(e: vscode.TextDocumentChangeEvent) {
    if (isProgrammatic) return;

    const uri = e.document.uri.toString();
    
    // A. HANDLE LINE SHIFTS (Enter key, Deletions, Pastes)
    // We must update our Map keys so history stays attached to the correct code.
    if (e.contentChanges.length > 0) {
        adjustLineHistoryOffsets(uri, e.contentChanges);
    }

    // B. SAVE SNAPSHOT (Debounced)
    // We only track the primary change for the undo stack to keep it simple
    if (e.contentChanges.length === 0) return;
    
    const primaryChange = e.contentChanges[0];
    const lineIndex = primaryChange.range.start.line;
    const document = e.document;
    
    // Edge case: If line was deleted, range.start.line might be out of bounds now?
    // checking bounds just in case.
    if (lineIndex >= document.lineCount) return;

    const text = document.lineAt(lineIndex).text;

    // Reset timer
    if (debounceTimer) clearTimeout(debounceTimer);

    // Wait 400ms after typing stops to save
    debounceTimer = setTimeout(() => {
        saveSnapshot(uri, lineIndex, text);
    }, 400);
}

/**
 * Adjusts the keys in our History Map when lines move up or down.
 */
function adjustLineHistoryOffsets(uri: string, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
    if (!history.has(uri)) return;
    const fileHistory = history.get(uri)!;
    const newFileHistory = new Map<number, LineHistory>();

    // We iterate over every existing history entry and calculate its new line number
    for (const [oldLineKey, hist] of fileHistory) {
        let newLineKey = oldLineKey;
        let shouldDelete = false;

        // Apply effect of every change on this line key
        for (const change of changes) {
            const linesAdded = (change.text.match(/\n/g) || []).length;
            const linesRemoved = change.range.end.line - change.range.start.line;
            const delta = linesAdded - linesRemoved;

            // If the history-line is BELOW the change, it shifts
            if (oldLineKey > change.range.end.line) {
                newLineKey += delta;
            } 
            // If the history-line is INSIDE the changed range (and it's not the start line),
            // it effectively got merged or deleted. We drop the history to avoid ghosts.
            else if (oldLineKey > change.range.start.line && oldLineKey <= change.range.end.line) {
                shouldDelete = true;
            }
        }

        if (!shouldDelete) {
            newFileHistory.set(newLineKey, hist);
        }
    }

    // Update the main storage with the shifted keys
    history.set(uri, newFileHistory);
}

/**
 * 2. Handle Cursor Selection
 * Just ensures we have an init state when clicking onto a line.
 */
function onSelectionChange(e: vscode.TextEditorSelectionChangeEvent) {
    if (isProgrammatic) return;

    const editor = e.textEditor;
    // Multi-cursor support is tricky; let's grab the primary cursor
    const line = e.selections[0].active.line;
    const uri = editor.document.uri.toString();
    const text = editor.document.lineAt(line).text;

    saveSnapshot(uri, line, text, true); 
}

/**
 * Core Logic: Save state to stack
 */
function saveSnapshot(uri: string, line: number, text: string, onlyInitIfMissing: boolean = false) {
    if (!history.has(uri)) history.set(uri, new Map());
    const fileHistory = history.get(uri)!;

    if (!fileHistory.has(line)) {
        fileHistory.set(line, {
            undoStack: [],
            redoStack: [],
            currentSnapshot: text // Initial state
        });
        return;
    }

    if (onlyInitIfMissing) return;

    const lineHistory = fileHistory.get(line)!;

    // Only push if text actually changed
    if (lineHistory.currentSnapshot !== text) {
        lineHistory.undoStack.push(lineHistory.currentSnapshot);
        lineHistory.redoStack = []; // Clear redo on new branch
        lineHistory.currentSnapshot = text;
    }
}

/**
 * 3. Restore (Undo/Redo)
 */
async function restore(action: 'undo' | 'redo') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = editor.selection.active.line;
    const uri = editor.document.uri.toString();
    const fileHistory = history.get(uri);
    
    if (!fileHistory || !fileHistory.get(line)) {
        vscode.window.setStatusBarMessage(`Ghost Line: nothing to ${action} (no history)`, 2000);
        return;
    }

    const lineHistory = fileHistory.get(line)!;
    const source = action === 'undo' ? lineHistory.undoStack : lineHistory.redoStack;
    const target = action === 'undo' ? lineHistory.redoStack : lineHistory.undoStack;

    if (source.length === 0) {
        vscode.window.setStatusBarMessage(`Ghost Line: nothing to ${action}`, 2000);
        return;
    }

    // 1. Push current state to target stack (so we can reverse this restore)
    const currentText = editor.document.lineAt(line).text;
    target.push(currentText);
    
    // 2. Pop the state we want
    const restoreText = source.pop()!;

    // 3. Apply edit
    isProgrammatic = true;
    await editor.edit(b => {
        b.replace(editor.document.lineAt(line).range, restoreText);
    });
    isProgrammatic = false;

    // 4. Update snapshot tracking
    lineHistory.currentSnapshot = restoreText;
}

export function deactivate() {}