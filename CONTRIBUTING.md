# Contributing to PoyberPaint

First off — thank you for considering contributing to **PoyberPaint**! 🎨

Whether you're fixing a bug, adding a feature, improving documentation, or just sharing ideas — every contribution matters.

---

## 📋 Table of Contents

- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Branch Naming](#-branch-naming)
- [Commit Conventions](#-commit-conventions)
- [Code Style](#-code-style)
- [Pull Request Process](#-pull-request-process)
- [Issues](#-issues)
- [Code of Conduct](#-code-of-conduct)

---

## 💡 How Can I Contribute?

### 🐛 Reporting Bugs

Before opening an issue:

1. **Search existing issues** — someone may have already reported it
2. **Check the [live demo](https://ashkanpoyber.github.io/PoyberPaint/)** to confirm the bug still exists
3. **Open a new issue** with:
   - A clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or screen recordings (if applicable)
   - Browser and OS info

### ✨ Suggesting Features

Feature requests are welcome! When opening an issue:

- Explain **why** the feature would be useful
- Describe how it should behave
- Add mockups or examples if possible
- Mention similar features in other apps (if any)

### 🔧 Submitting Code

1. Fork the repository
2. Create a branch from `main` (see [Branch Naming](#-branch-naming))
3. Make your changes
4. Test thoroughly (see [Development Setup](#-development-setup))
5. Commit using [Conventional Commits](#-commit-conventions)
6. Push and open a Pull Request

### 📝 Improving Documentation

Typos, unclear explanations, missing examples — all fair game. Docs PRs are just as valuable as code PRs!

---

## 🛠 Development Setup

PoyberPaint is a **zero-build project** — no bundlers, no npm install required.

### Option 1: Just open it

```bash
git clone https://github.com/ashkanpoyber/PoyberPaint.git
cd PoyberPaint
```

Then open `index.html` in your browser.

## Option 2: Local server (recommended)

# Using Python

`python -m http.server 8000`

# Using Node.js

`npx serve .`

Then visit `http://localhost:8000.`
Why a local server? Some browsers restrict features (file uploads, LocalStorage) when opening files via `file://.`

# 📂 Project Structure

PoyberPaint/

├── index.html # Main app — all markup

├── css/

│ └── style.css # Custom styles

├── js/

│ ├── storage.js # LocalStorage wrapper

│ └── app.js # Main application logic

├── assets/

│ ├── favicon.svg

│ ├── preview.png

│ └── demo.gif

├── CONTRIBUTING.md

├── LICENSE

└── README.md

File Responsibility
`js/app.js` Drawing tools, canvas logic, event handling
`js/storage.js` Persistence — canvas, settings, background
`css/style.css` Theme, cursor, floating text input

# 🌿 Branch Naming

Do not commit directly to `main`. Create a branch based on the type of change:
Prefix Purpose
`feat/` New features
`fix/` Bug fixes
`refactor/` Code restructuring
`docs/` Documentation
`style/` Styling or formatting
`perf/` Performance improvements
`test/` Tests
`chore/` Maintenance

## Examples

```bash
feat/text-tool
feat/layer-system
fix/background-transform
fix/flood-fill-tolerance
refactor/canvas-setup
docs/update-roadmap
style/dark-mode-colors
perf/flood-fill-scanline
chore/update-dependencies
```

Keep branch names short and descriptive.

# 📝 Commit Conventions

This project follows [Conventional Commits}(https://www.conventionalcommits.org/):
`<type>(<scope>): <description>`

## Types

Type When to use
`feat` New feature
`fix` Bug fix
`docs` Documentation only
`style` Formatting, no code change
`refactor` Code change that neither fixes nor adds
`perf` Performance improvement
`test` Adding or fixing tests
`chore` Maintenance, configs, dependencies

## Examples

```bash
feat: add text tool with floating input
fix: background image not showing on retina displays
docs: update README with new screenshots
refactor: extract color swatch builder into function
perf: optimize flood fill with scanline algorithm
```

## Breaking changes

Add `!` after the type:
text

```bash
feat!: change storage format
```

## 🎨 Code Style

### General

    2 spaces for indentation

    End files with a newline

    No trailing whitespace

    Keep code simple, readable, consistent

### JavaScript

    Vanilla JS only — no frameworks or libraries (Tailwind via CDN is the only exception)

    Use ```const``` / ```let``` — never ```var```

    Prefer arrow functions for callbacks

    Use descriptive names — ```brushWidth``` not bw

    Keep functions focused — one job per function

    Add comments for complex logic (flood fill, DPR, transforms)

### CSS

    Prefer Tailwind utility classes

    Custom CSS only when Tailwind can't do it

    Follow kebab-case for class names

### HTML

    Use semantic tags (<header>, <main>, <aside>)

    Add ARIA labels to icon-only buttons

    Keep markup clean

### 🔀 Pull Request Process

Before opening a PR:

    Make sure your branch is up to date with main

    Test your changes locally

    Make sure existing functionality still works

    Keep the PR focused on one purpose

    Do not include passwords, API keys, or other secrets

    Update documentation when necessary

PR titles should follow Conventional Commits:
text

feat: add birthday message templates
fix: prevent invalid recipient emails

PR Checklist

    □

    Code follows the style guide above
    □

    Tested locally (desktop + mobile)
    □

    No console errors
    □

    README updated (if needed)
    □

    Commits follow conventional format
    □

    Branch is up to date with main

🐛 Issues

Use the appropriate label:

    [BUG] — for bugs

    [FEATURE] — for new features

    [IMPROVEMENT] — for improvements

Check existing issues before creating a new one.
🔒 Security

Do not publicly report security vulnerabilities through GitHub issues.

If you find a security issue, please report it privately via GitHub profile contact.
🤝 Code of Conduct

All contributors are expected to be respectful and constructive.

Harassment, discrimination, personal attacks, threats, and sharing someone's private information are not tolerated.

Project maintainers may remove content or restrict participation when this code of conduct is violated.
🎁 Ideas for First Contributions

New to the project? Here are some friendly entry points:

    🐛 Fix typos in README or code comments

    🎨 Suggest a new color palette

    🌐 Add RTL support for Persian/Arabic users

    📱 Improve mobile touch interactions

    ⌨️ Add more keyboard shortcuts

    📤 Add "Export as SVG" option

Check the Roadmap for planned features.

<div align="center">

Thank you for contributing! Happy drawing! 🎨

</div> ```
