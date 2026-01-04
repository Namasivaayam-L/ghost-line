import * as vscode from 'vscode';

interface LineHistory {
    undoStack: string[];
    redoStack: string[];
    currentSnapshot: string;
}

const history = new Map<string, Map<number, LineHistory>>();
let isProgrammatic = false;
let debounceTimer: NodeJS.Timeout | undefined;

function getConfig() {
    const cfg = vscode.workspace.getConfiguration('ghostLine');
    return {
        maxHistoryPerLine: cfg.get<number>('maxHistoryPerLine', 20),
        idleDelay: cfg.get<number>('idleDelay', 400),
        enableShortcuts: cfg.get<boolean>('enableShortcuts', true)
    };
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Ghost Line 👻 ACTIVE');

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange),
        vscode.window.onDidChangeTextEditorSelection(onSelectionChange),
        vscode.commands.registerCommand('line-undo.undo', () => guardedRestore('undo')),
        vscode.commands.registerCommand('line-undo.redo', () => guardedRestore('redo')),
        vscode.commands.registerCommand('ghostLine.listUndo', () => guardedShowHistory('undo')),
        vscode.commands.registerCommand('ghostLine.listRedo', () => guardedShowHistory('redo'))

    );
}

function onDocumentChange(e: vscode.TextDocumentChangeEvent) {
    if (isProgrammatic) return;

    const { idleDelay } = getConfig();
    if (idleDelay <= 0) return;

    const uri = e.document.uri.toString();

    if (e.contentChanges.length > 0) {
        adjustLineHistoryOffsets(uri, e.contentChanges);
    }

    if (e.contentChanges.length === 0) return;

    const change = e.contentChanges[0];
    const line = change.range.start.line;
    if (line >= e.document.lineCount) return;

    const text = e.document.lineAt(line).text;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        saveSnapshot(uri, line, text);
    }, idleDelay);
}

function onSelectionChange(e: vscode.TextEditorSelectionChangeEvent) {
    if (isProgrammatic) return;

    const editor = e.textEditor;
    const line = editor.selections[0].active.line;
    const uri = editor.document.uri.toString();
    const text = editor.document.lineAt(line).text;

    saveSnapshot(uri, line, text, true);
}

function saveSnapshot(uri: string, line: number, text: string, onlyInitIfMissing = false) {
    const { maxHistoryPerLine } = getConfig();

    if (!history.has(uri)) history.set(uri, new Map());
    const fileHistory = history.get(uri)!;

    if (!fileHistory.has(line)) {
        fileHistory.set(line, {
            undoStack: [],
            redoStack: [],
            currentSnapshot: text
        });
        return;
    }

    if (onlyInitIfMissing) return;

    const h = fileHistory.get(line)!;

    if (h.currentSnapshot !== text) {
        h.undoStack.push(h.currentSnapshot);
        if (h.undoStack.length > maxHistoryPerLine) {
            h.undoStack.shift();
        }
        h.redoStack = [];
        h.currentSnapshot = text;
    }
}

async function guardedRestore(action: 'undo' | 'redo') {
    const { enableShortcuts } = getConfig();
    if (!enableShortcuts) return;
    await restore(action);
}

async function restore(action: 'undo' | 'redo') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = editor.selection.active.line;
    const uri = editor.document.uri.toString();
    const h = history.get(uri)?.get(line);
    if (!h) return;

    const source = action === 'undo' ? h.undoStack : h.redoStack;
    const target = action === 'undo' ? h.redoStack : h.undoStack;
    if (source.length === 0) return;

    const currentText = editor.document.lineAt(line).text;
    target.push(currentText);
    const restoreText = source.pop()!;

    isProgrammatic = true;
    await editor.edit(b => {
        b.replace(editor.document.lineAt(line).range, restoreText);
    });
    isProgrammatic = false;

    h.currentSnapshot = restoreText;
}

function adjustLineHistoryOffsets(uri: string, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
    if (!history.has(uri)) return;
    const fileHistory = history.get(uri)!;
    const next = new Map<number, LineHistory>();

    for (const [line, h] of fileHistory) {
        let newLine = line;
        let drop = false;

        for (const c of changes) {
            const added = (c.text.match(/\n/g) || []).length;
            const removed = c.range.end.line - c.range.start.line;
            const delta = added - removed;

            if (line > c.range.end.line) newLine += delta;
            else if (line > c.range.start.line && line <= c.range.end.line) drop = true;
        }

        if (!drop) next.set(newLine, h);
    }

    history.set(uri, next);
}

async function guardedShowHistory(mode: 'undo' | 'redo') {
    const { enableShortcuts } = getConfig();
    if (!enableShortcuts) return;
    await showLineHistory(mode);
}


async function showLineHistory(mode: 'undo' | 'redo') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = editor.selection.active.line;
    const uri = editor.document.uri.toString();
    const h = history.get(uri)?.get(line);
    if (!h) return;

    const stack = mode === 'undo' ? h.undoStack : h.redoStack;
    if (stack.length === 0) {
        vscode.window.showInformationMessage(`Ghost Line: no ${mode} history for this line`);
        return;
    }

    const items: vscode.QuickPickItem[] = [];
    // const ordered = mode === 'undo' ? stack : [...stack].reverse();
    const ordered = [...stack].reverse();

    for (let i = 0; i < ordered.length; i++) {
        items.push({
            label: `${mode === 'undo' ? 'Undo' : 'Redo'} #${i + 1}`,
            description: truncate(ordered[i]),
            detail: ordered[i]
        });
    }

    const picked = await vscode.window.showQuickPick(items, {
        title: `👻 Ghost Line ${mode === 'undo' ? 'Undo' : 'Redo'} History`,
        canPickMany: false
    });

    if (!picked) return;

    const text = picked.detail!;
    isProgrammatic = true;
    await editor.edit(b => {
        b.replace(editor.document.lineAt(line).range, text);
    });
    isProgrammatic = false;

    h.currentSnapshot = text;
}

function truncate(text: string, max = 80) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

export function deactivate() {}
