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

## [2.0.0] - 2026-09-25

### Added

- 🗂️ Layer system with multi-canvas architecture
- 👁️ Visibility toggle per layer
- 🎚️ Opacity slider per layer
- 🔄 Active layer switching
- ✏️ Layer rename (double-click)
- 🗑️ Layer delete with confirmation
- 📋 Layer duplicate (Shift+D)
- ⌨️ Shift+N shortcut for new layer
- 💾 Full multi-layer persistence

### Changed

- Refactored to `LayerStore` as single source of truth
- Undo/redo is now per-layer
- Save PNG merges all visible layers

### Fixed

- Drawing wiped on page reload (resize corruption)
- Rename input stuck, blocking UI
- Layer list not refreshing after rename

## [1.3.0] - 2026-09-24

### Added

- 🖼️ **Image import** — load any image as a reference layer (auto-compressed)
- 🖐️ **Pan** — drag the background image when Move BG tool is active
- 🔍 **Zoom** — mouse wheel + zoom in/out buttons
- 📐 **Resize handles** — drag any corner to scale the image
- 🔄 **Rotate handle** — drag the top handle to rotate; hold Shift to snap to 15°
- 🎯 **Reset** button for background transform
- 💾 Background transform persistence (pan, zoom, scale, rotation)

### Changed

- Background image now renders in a separate DOM layer (behind canvas)
- Canvas is now transparent — drawing layer only
- Background image uses `object-contain` for full visibility
- Renamed "Background Image" to "Import Image" for clarity
- Renamed "Remove Background" to "Remove Image"

### Fixed

- Overlay bounds now correctly match contain-fit + rotation
- Removed `pointer-events: none` on canvas that blocked pan
- `zoomBg()` Math.min bug that capped scale at 0.3
- Export now applies rotation and correct contain-fit
- Eraser uses `destination-out` composite for true transparency

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
