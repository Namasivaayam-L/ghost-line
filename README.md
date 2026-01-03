
---

# 👻 Ghost Line

**Atomic, line-level undo & redo for VS Code.**

Global undo (`Ctrl+Z`) is great — until it isn’t.
Ghost Line gives you **surgical control**: undo or redo **only the current line**, without rewinding unrelated edits elsewhere in the file.

This extension is designed for developers who want precision instead of chaos.

---

## ✨ Features

* **Line-level undo / redo**

  * Undo or redo changes on the *current line only*
  * Other lines remain untouched

* **Independent from global undo**

  * Does not interfere with VS Code’s native undo stack

* **Snapshot-based & deterministic**

  * Tracks intentional edit boundaries instead of raw keystrokes
  * Avoids broken or partial undo states

* **Debounced history capture**

  * Line state is saved after typing pauses (default: 400ms)
  * Prevents noisy, character-by-character undo steps

* **Handles line shifts**

  * History stays attached even when lines move due to:

    * Enter
    * Delete
    * Paste
    * Multi-line edits

---

## ⌨️ Commands & Shortcuts

| Action    | Command     | Default Shortcut         |
| --------- | ----------- | ------------------------ |
| Line Undo | `Line Undo` | `Ctrl + Alt + Z`         |
| Line Redo | `Line Redo` | `Ctrl + Alt + Shift + Z` |

> You can rebind these shortcuts from **Keyboard Shortcuts**.

---

## 🧠 How It Works (High-level)

Ghost Line uses a **snapshot-based model**, not a diff-based one.

* Each line maintains its own history:

  * undo stack
  * redo stack
  * current snapshot
* Snapshots are captured:

  * when typing pauses (debounced)
  * when you move the cursor onto a line
* Undo/redo restores snapshots **only for the active line**

This design avoids API limitations in VS Code and ensures predictable behavior.

---

## ⚠️ Known Limitations (by design)

* Multi-cursor editing is currently tracked using the **primary cursor only**
* Undo history is **per session** (not persisted across reloads)
* Snapshot commits require either:

  * a short pause in typing, or
  * a cursor movement

These trade-offs are intentional for correctness and stability.

---

## 🛠️ Development Status

This is the **initial public version**.

Planned improvements:

* Snapshot-on-idle refinement
* Multi-cursor support
* Visual indicators for lines with history
* Optional persistence

Contributions and feedback are welcome.

---

## 📦 Installation

Until published on the Marketplace:

```bash
git clone https://github.com/<your-username>/ghost-line
cd ghost-line
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

---

## 📜 License

MIT

---