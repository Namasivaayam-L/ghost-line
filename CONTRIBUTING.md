# Contributing to Ghost Line 👻

Thanks for your interest in contributing to **Ghost Line** — intent-aware, line-level undo & redo for VS Code.

Ghost Line is a **precision tool**, not a feature dump.
Contributions are welcome, but correctness and intent always come first.

Please read this document before opening an issue or PR.

---

## Philosophy & Scope 🧠

Ghost Line is built around a few core principles:

* **Intent-aware editing**
* **Predictable behavior**
* **Zero interference with native undo**
* **Explicit non-goals**

If a change violates one of these, it likely won’t be accepted — even if it’s clever.

This project favors:

* clarity over cleverness
* correctness over coverage
* boring code over fragile magic

---

## What You Can Contribute ✅

We actively welcome contributions in these areas:

### 🐞 Bug Fixes

* Incorrect undo/redo behavior
* Edge cases around line movement
* History corruption or leaks
* Regression fixes

### 🧪 Correctness Improvements

* Guarding against VS Code API quirks
* Better handling of debounced snapshots
* History consistency under edge conditions

### 🧭 UX Improvements (Low Noise)

* Clearer status messages
* Safer defaults
* Discoverability improvements that don’t add clutter

### 📝 Documentation

* Clarifying README sections
* Adding diagrams or explanations
* Improving comments around tricky logic

---

## What Is Explicitly Out of Scope ❌

These will likely be rejected unless discussed first:

* Multi-cursor semantics
* Block or range-based undo
* Global undo replacement
* Format-on-save integration
* AI / agent-driven editing heuristics
* Persistent history across reloads
* “Just like Vim / Emacs” parity features

Ghost Line is **line-focused by design**.

---

## Before Opening an Issue 🧩

Please check:

1. Existing issues (open & closed)
2. README → *Explicit Non-Goals*
3. README → *Known Limitations*

When opening an issue, include:

* Clear reproduction steps
* Expected vs actual behavior
* File type (TS, JS, JSON, etc.)
* Whether native undo was also involved

Vague reports are hard to act on.

---

## Development Setup 🛠️

```bash
git clone https://github.com/Namasivaayam-L/ghost-line
cd ghost-line
npm install
npm run compile
```

Run the extension:

1. Open the project in VS Code
2. Press `F5`
3. Use the **Extension Development Host**
4. Test changes there — not in your main editor

---

## Code Guidelines 🧑‍💻

### General

* Prefer readable, explicit logic
* Avoid clever state machines
* Comment **why**, not what

### History Logic

* Every change must preserve:

  * per-line isolation
  * undo/redo symmetry
  * snapshot correctness
* Guard against feedback loops (`isProgrammatic`)

### Performance

* Avoid per-keystroke heavy logic
* Prefer debounced or cursor-driven capture
* Keep memory usage bounded

---

## Pull Request Guidelines 🔍

Before submitting a PR:

* Keep PRs **small and focused**
* One logical change per PR
* No drive-by refactors
* No formatting-only PRs

Your PR description should explain:

* the problem being solved
* why the existing behavior is insufficient
* why your approach respects Ghost Line’s scope

Tests aren’t required yet — but **manual verification steps are**.

---

## Discussions & Ideas 💬

If you’re unsure whether something fits:

* Open a discussion
* Or open an issue labeled as *proposal*

Early discussion saves everyone time.

---

## Code of Conduct 🤝

Be respectful.
Assume good intent.
Disagree on ideas, not people.

This project is built in public — let’s keep it constructive.

---

## Final Note 👻

Ghost Line exists because global undo doesn’t respect developer intent.

If your contribution strengthens that mission —
you’re very welcome here.

Happy hacking 👻
