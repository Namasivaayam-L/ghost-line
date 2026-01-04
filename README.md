# 👻 Ghost Line

**Surgical, line-level undo & redo for VS Code.**

Global undo (`Ctrl+Z`) is powerful — and wildly overkill.
Ghost Line gives you **deterministic, snapshot-based undo and redo for a single line**, without rewinding unrelated edits elsewhere in the file.

No magic. No noise. Just precision.

---

## Why Ghost Line Exists

VS Code’s global undo stack is **temporal**, not **intentional**.

That means:
- Editing two distant lines interleaves undo history
- Fixing a typo can nuke unrelated progress
- Undo becomes a gamble instead of a tool

Ghost Line fixes this by treating **each line as an independent editing unit**.

Undo exactly what you meant. Nothing else.

---

## What Ghost Line Is (and Isn’t)

### ✅ What it is
- Line-scoped undo & redo
- Snapshot-based (not keystroke-based)
- Deterministic and predictable
- Explicit, user-triggered actions
- Independent of VS Code’s undo stack

### ❌ What it is not
- A replacement for global undo
- A visual-heavy editor gimmick
- A refactor or agent-aware system
- A passive background modifier

Ghost Line is **intentional by design**.

---

## Core Features

### ✨ Line-Level Undo / Redo
- Undo or redo **only the current line**
- Other lines remain untouched
- No interference with global undo

### 🧠 Snapshot-Based History
- Tracks **line snapshots**, not raw keystrokes
- Prevents partial or broken undo states
- Redo stack is cleared on new edits (proper branching)

### ⏱️ Idle-Based Capture
- Snapshots are committed after typing pauses
- Default idle delay: **400ms**
- Avoids noisy, character-by-character history
- Can be disabled entirely

### 🧭 Cursor-Safe Initialization
- First time you land on a line, its state is captured
- Prevents the classic “first undo does nothing” bug

---

## Commands & Shortcuts

### Per-Line Actions

| Action | Shortcut |
|------|--------|
| Undo current line | `Ctrl + Alt + Z` |
| Redo current line | `Ctrl + Alt + Y` |

### History Inspection

| Action | Shortcut |
|------|--------|
| List line undo history | `Ctrl + Shift + Alt + Z` |
| List line redo history | `Ctrl + Shift + Alt + Y` |

> macOS users: `Ctrl` → `Cmd`

---

## History Inspection UX (Intentional Design)

Ghost Line **does not show persistent UI indicators**.

No gutter dots. No clutter.

Instead:
- History is accessed **only when requested**
- A QuickPick lists snapshots **newest → oldest**
- Clicking an entry restores that exact snapshot
- Restores do **not** create new history entries

Inspection is read-only until you explicitly act.

---

## Configuration

Ghost Line exposes three settings:

```json
{
  "ghostLine.maxHistoryPerLine": 20,
  "ghostLine.idleDelay": 400,
  "ghostLine.enableShortcuts": true
}
```

### `maxHistoryPerLine`

* Hard cap on undo snapshots per line
* Oldest entries are evicted
* Prevents unbounded memory growth

### `idleDelay`

* Idle time (ms) before snapshot is captured
* `0` disables idle-based snapshots entirely
* Changes apply immediately (no reload needed)

### `enableShortcuts`

* Gates **all shortcut-triggered commands**
* Keybindings remain registered (VS Code limitation)
* Commands safely no-op when disabled
* Command Palette always works

---

## Architectural Model

History is stored as:

```ts
Map<FileURI, Map<LineNumber, LineHistory>>
```

```ts
interface LineHistory {
  undoStack: string[];
  redoStack: string[];
  currentSnapshot: string;
}
```

* History is **per file, per line**
* Line history follows lines when they move
* Deleted lines have their history dropped
* Programmatic edits are guarded to avoid feedback loops

---

## Explicit Non-Goals

Ghost Line does **not guarantee deterministic behavior** for:

* Multi-cursor edits
* Large refactors
* Format-on-save
* AI / agent-driven bulk edits

Behavior in these cases is:

* Best-effort
* Non-crashing
* Non-corrupting

These boundaries are intentional.

---

## Stability Status

### Verified

* Idle snapshot capture
* History cap enforcement
* Per-line undo / redo correctness
* Branching behavior
* History restore via QuickPick
* Shortcut gating

### Known Limitations (Accepted)

* No multi-cursor semantics
* No agent-aware heuristics

---

## Philosophy

Ghost Line behaves like a **first-class editing primitive**, not a convenience hack.

It is:

* Predictable
* Discoverable
* Memory-safe
* UX-clean

If global undo feels like a sledgehammer,
Ghost Line is the scalpel.

---

## Versioning

* Current version: **0.0.1**
* Public API is stable, internals may evolve
* 1.0.0 will land only after multi-cursor or agent semantics are addressed

---

## License

MIT

---

👻 **Ghost Line** — Undo exactly what you meant.

```
```
