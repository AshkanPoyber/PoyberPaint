# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Layer system
- Export to SVG
- Custom canvas size
- Color history

---

## [1.2.0] - 2026-09-23

### Added

- 🖼️ Background image upload (with compression)
- 🖐️ Move BG tool — pan, zoom, and reset background position
- 💾 Background transform persistence via LocalStorage
- 🎨 Background controls panel (zoom in/out/reset)

### Changed

- Background image now renders in a separate DOM layer (behind canvas)
- Canvas is now transparent — drawing layer only
- Background image uses `object-contain` (full image visible)

### Fixed

- Background image not showing due to stale history restore
- `removeBackground` referencing undefined variable
- Eraser now uses `destination-out` composite (true transparency)

---

## [1.1.0] - 2026-09-20

### Added

- ✍️ Text tool with floating input
- 📏 Line tool
- ➡️ Arrow tool with dynamic arrowhead geometry
- 🪣 Flood fill (bucket) tool using BFS algorithm
- 🌗 Light/dark theme toggle with FOUC prevention
- 💽 LocalStorage persistence for canvas and settings
- ⌨️ Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
- 📱 Responsive layout for mobile and tablet
- 🖥️ DPR-aware canvas rendering

### Changed

- Refactored `app.js` into focused modules
- Split `Storage` into separate file

### Fixed

- Canvas resize preserving previous content correctly
- Undo/redo stack after resize

---

## [1.0.0] - 2026-09-15

### Added

- 🎨 Initial release
- 🖌️ Brush and eraser tools
- 🔷 Rectangle, circle, and triangle shapes
- 🎨 10-color palette + custom color picker
- 📏 Adjustable brush size (1–60px)
- 💾 Save as PNG
- 🗑️ Clear canvas
- 🌙 Dark theme UI (TailwindCSS)
- 🎯 Pointer Events (mouse, touch, stylus)
- ↩️ Undo/redo (30 states)

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) — incompatible changes
- **MINOR** (0.X.0) — new features, backwards compatible
- **PATCH** (0.0.X) — bug fixes, backwards compatible

---

<div align="center">

**📌 Full history of every change, every release. 🎨**

</div>
