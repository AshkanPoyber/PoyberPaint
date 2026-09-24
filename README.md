<div align="center">

<img src="assets/preview.png" alt="PoyberPaint Preview" width="100%" style="border-radius: 12px;" />

<br />
<br />

# 🎨 PoyberPaint

**A modern, lightweight paint & drawing web app — right in your browser.**

Draw. Sketch. Create.

<br />

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ashkanpoyber.github.io/PoyberPaint/)
[![Made with JavaScript](https://img.shields.io/badge/Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/ashkanpoyber/PoyberPaint?style=for-the-badge&color=facc15&logo=github)](https://github.com/ashkanpoyber/PoyberPaint/stargazers)
[![Latest Release](https://img.shields.io/github/v/release/ashkanpoyber/PoyberPaint?style=for-the-badge&color=6366f1&logo=github)](https://github.com/ashkanpoyber/PoyberPaint/releases)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 Drawing Tools

- 🖌️ **Brush** — smooth freehand drawing
- 🧽 **Eraser** — true transparency with destination-out
- ✍️ **Text** — click, type, and place text anywhere
- 📏 **Line** — draw straight lines
- ➡️ **Arrow** — with dynamic arrowhead geometry
- 🔷 **Shapes** — rectangle, circle, triangle
- 🪣 **Flood Fill** — BFS-based bucket tool

</td>
<td width="50%">

### ⚡ Experience

- ↩️ **Undo / Redo** — with `Ctrl+Z` / `Ctrl+Y`
- 💾 **Export PNG** — one click, `Ctrl+S`
- 🌗 **Light / Dark theme** — auto-saved
- 💽 **Auto-save** — persists across reloads
- 📱 **Fully responsive** — works on any screen
- 🖱️ **Pointer Events** — mouse, touch, stylus
- 🖥️ **Retina-ready** — crisp on high-DPI

</td>
</tr>
</table>

---

### 🖼️ Image Layer

Import any image as a reference layer — perfect for tracing, mood boards, or drawing over photos.

- 📤 **Import** — load JPG, PNG, WebP, GIF (auto-compressed)
- 🖐️ **Pan** — drag to reposition
- 🔍 **Zoom** — mouse wheel or buttons
- 📐 **Resize** — drag any corner handle
- 🔄 **Rotate** — drag the top handle (Shift to snap)
- 🎯 **Reset** — restore original position
- 💾 **Persisted** — transform survives reloads

---

## 🎬 Demo

<div align="center">

<img src="assets/demo.gif" alt="PoyberPaint Demo" width="80%" style="border-radius: 12px;" />

</div>

👉 **[Try it live →](https://ashkanpoyber.github.io/PoyberPaint/)**

---

## 🛠️ Tech Stack

<div align="center">

|     Layer     | Choice                         |
| :-----------: | :----------------------------- |
|  **Markup**   | HTML5                          |
|  **Styling**  | TailwindCSS (CDN) + custom CSS |
|   **Logic**   | Vanilla JavaScript (ES6+)      |
| **Rendering** | HTML5 Canvas API               |
|   **Icons**   | Inline SVG                     |
|   **Font**    | Inter + JetBrains Mono         |
|  **Storage**  | LocalStorage                   |
|  **Hosting**  | GitHub Pages                   |

</div>

---

## 🧠 What I Learned

Building PoyberPaint helped me practice:

- 🎨 **Canvas API** — `getImageData`, `putImageData`, paths, transforms, `fillText`
- 🪣 **Flood Fill algorithm** — BFS traversal with anti-alias tolerance
- 🖱️ **Pointer Events** — unified mouse / touch / stylus handling with `setPointerCapture`
- 🖥️ **DPR-aware rendering** — crisp output on retina displays using `devicePixelRatio`
- 📐 **Vector math** — arrowhead geometry via `Math.atan2` and trigonometry
- ✍️ **Hybrid DOM + Canvas** — floating `<input>` for text, committed to canvas
- 🗂️ **State management** — undo/redo stack with bounded history, no framework
- 💽 **Persistence** — canvas + settings via `LocalStorage` with graceful fallbacks
- ⏱️ **Debouncing** — smooth canvas resize handling
- 🧩 **Modular architecture** — clean separation of concerns in vanilla JS
- 🌗 **Theming** — dark/light toggle with FOUC prevention
- 🖼️ **Image manipulation** — pan, zoom, resize, and rotate with SVG overlay handles
- 📐 **Transform math** — combining translate, scale, and rotate with correct bounds
- 🎯 **Hit detection** — SVG pointer events on rotated bounding boxes

---

## ⌨️ Keyboard Shortcuts

<div align="center">

|  Shortcut  | Action      |
| :--------: | :---------- |
| `Ctrl + Z` | Undo        |
| `Ctrl + Y` | Redo        |
| `Ctrl + S` | Save as PNG |

</div>

---

## 📦 Getting Started

### Option 1: Just open it

```bash
git clone https://github.com/ashkanpoyber/PoyberPaint.git
cd PoyberPaint
```

Then open `index.html` in your browser — no build step needed.

### Option 2: Local server

`npx serve .`

or

`python -m http.server 8000`

## 📂 Project Structure

PoyberPaint/

├── index.html # Main app

├── css/

│ └── style.css # Custom styles

├── js/

│ ├── storage.js # LocalStorage module

│ └── app.js # Main logic

├── assets/

│ ├── favicon.svg

│ ├── preview.png

│ └── demo.gif

├── LICENSE

└── README.md

## 🗺️ Roadmap

- [x] Brush, eraser, shapes
- [x] Line & arrow tools
- [x] Text tool
- [x] Flood fill (bucket)
- [x] Undo / redo
- [x] Save as PNG
- [x] Responsive dark UI
- [x] Light / dark theme toggle
- [x] LocalStorage persistence
- [x] Image import with pan, zoom, resize, rotate
- [ ] Layer system
- [ ] Export to SVG
- [ ] Background removal

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/ashkanpoyber/PoyberPaint/issues).

If you like this project, please consider giving it a ⭐

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](https://./LICENSE) file for details.

## 👤 Author

<div align="center">

MohammadReza Dalili (AshkanPoyber)

</div><div align="center">

⭐ If you like this project, give it a star! ⭐

Made with ❤️ by AshkanPoyber

</div>
