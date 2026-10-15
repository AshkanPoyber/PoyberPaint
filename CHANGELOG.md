# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Custom canvas size
- Gradient tool
- Background removal

---

## [2.2.0] - 2026-10-15

### Added

- 🎯 **Export to SVG** — true vector export, not a rasterized image
  - Brush strokes become `<path>` elements
  - Shapes → `<rect>`, `<circle>`, `<polygon>`, `<line>`, `<polyline>`
  - Text → `<text>` with JetBrains Mono fallback
  - Eraser → SVG `<mask>` (true transparency, editable in Figma/Illustrator)
  - Background image → `<image>` with transforms preserved
- 🧭 **Vector Store** — tracks every action as vector data (runs alongside the canvas)
- 🪟 **SVG Export modal** — filename input + live warnings for unsupported content
- ⚠️ **Flood-fill warning** — users are notified when a layer contains pixel-only content that can't be vectorized
- ⌨️ **`Ctrl + Shift + S`** shortcut for SVG export

### Changed

- 🎨 New `Export SVG` button in the Actions panel (outline accent style)
- 💬 Warning box in the SVG export modal (amber, non-blocking)

### Internal

- 📦 `js/vector-store.js` — new module for action tracking
- 📦 `js/svg-export.js` — new module for SVG serialization
- 🌐 `window.LayerStore` exposed for sibling modules
- ↩️ Undo/redo now syncs vector actions
- 🗑️ Layer delete/duplicate propagates to vector store

### Fixed

- `VectorStore.push` could overwrite `layerId` with `undefined`
- Background image could be pushed twice to the vector store

### Notes

- Flood fill is not exported to SVG (pixel-based) — a warning is shown instead
- SVG output is DPR-independent (uses CSS pixels)
- Hidden layers are not exported (matches PNG export behavior)

---

## [2.1.0] - 2026-10-01

### Added

- 💾 **Save modal** — file name input with success toast
- 🔄 **Reset modal** — confirmation dialog (replacing browser `confirm`)
- 🗑️ **Delete layer modal** — confirmation dialog per layer
- ❓ **Help modal** — shortcuts and tips, accessible from the header
- 🔔 **Toast notifications** — for all major actions (save, reset, theme toggle, add/delete/duplicate layer, clear canvas, import image)
- ⏳ **Loading state** for image import — spinner + "Importing image…" text
- 🎨 **Custom scrollbar** — thin, rounded, accent-tinted (globally)

### Changed

- 🧊 Modernized UI — glassmorphic panels, subtle hover elevation
- 🎯 Section titles now have gradient accent lines
- ⌨️ Tool buttons show keyboard hint badges
- 🎨 Save button uses a gradient (accent → fuchsia)
- 👁️ Layer delete button reveals only on hover (like Figma)
- 📐 Tools panel width reduced 260px → 240px for a wider canvas
- 🖼️ Header reverted to non-sticky (was intrusive)
- 📄 Footer shortcuts moved into the new Help modal

### Fixed

- Delete layer no longer uses a native browser confirm dialog
- Theme toggle now provides visual feedback via toast

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

---

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
- `zoomBg()` `Math.min` bug that capped scale at 0.3
- Export now applies rotation and correct contain-fit
- Eraser uses `destination-out` composite for true transparency

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
