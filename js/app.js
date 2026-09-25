/**
 * PoyberPaint — A Modern Paint & Drawing Web App.
 * @author AshkanPoyber
 * @version 2.0.0 (Layer System)
 */

(() => {
  "use strict";

  // ---------- DOM ----------
  const layerStack = document.getElementById("layerStack");
  const toolBtns = document.querySelectorAll(".tool-btn");
  const fillColor = document.getElementById("fillColor");
  const sizeSlider = document.getElementById("sizeSlider");
  const sizeLabel = document.getElementById("sizeLabel");
  const colorRow = document.getElementById("colorRow");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const saveIndicator = document.getElementById("saveIndicator");
  const themeToggle = document.getElementById("themeToggle");
  const canvasWrapper = document.getElementById("canvasWrapper");
  const bgUpload = document.getElementById("bgUpload");
  const clearBgBtn = document.getElementById("clearBg");
  const bgLayer = document.getElementById("bgLayer");
  const bgControls = document.getElementById("bgControls");
  const bgFlipHBtn = document.getElementById("bgFlipH");
  const bgFlipVBtn = document.getElementById("bgFlipV");
  const bgOverlay = document.getElementById("bgOverlay");
  const bgBBox = document.getElementById("bgBBox");
  const handleTL = document.getElementById("handleTL");
  const handleTR = document.getElementById("handleTR");
  const handleBL = document.getElementById("handleBL");
  const handleBR = document.getElementById("handleBR");
  const rotateHandle = document.getElementById("rotateHandle");
  const rotateLine = document.getElementById("rotateLine");
  const layerList = document.getElementById("layerList");
  const addLayerBtn = document.getElementById("addLayerBtn");
  const layerOpacity = document.getElementById("layerOpacity");
  const layerOpacityLabel = document.getElementById("layerOpacityLabel");

  // ---------- Constants ----------
  const PALETTE = [
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#94a3b8",
  ];
  const MAX_HISTORY = 30;
  const DPR = window.devicePixelRatio || 1;
  const SNAP_THRESHOLD = 15;

  const TOOL_KEYS = {
    b: "brush",
    e: "eraser",
    t: "text",
    r: "rectangle",
    c: "circle",
    l: "line",
    a: "arrow",
    f: "fill",
    m: "move-bg",
  };

  // ---------- App State ----------
  let isDrawing = false;
  let selectedTool = "brush";
  let brushWidth = 5;
  let selectedColor = "#000000";
  let startX = 0;
  let startY = 0;
  let snapshot = null;
  let saveIndicatorTimer = null;
  let textInputEl = null;
  let backgroundDataURL = null;
  let bgTransform = { x: 0, y: 0, scale: 1, rotation: 0, flipH: 1, flipV: 1 };
  let isPanningBg = false;
  let bgPanStart = { x: 0, y: 0 };
  let isResizingBg = false;
  let isRotatingBg = false;
  let rotateStart = { angle: 0, rotation: 0, centerX: 0, centerY: 0 };
  let resizeStart = { x: 0, y: 0, scale: 1, centerX: 0, centerY: 0 };
  let isRenamingLayer = false;

  // ═══════════════════════════════════════════════════════
  //  LAYER STORE — Single Source of Truth
  // ═══════════════════════════════════════════════════════
  const LayerStore = {
    layers: [],
    activeLayerId: null,
    nextId: 1,

    // ─── Queries ─────────────────────────────────
    getActive() {
      return this.layers.find((l) => l.id === this.activeLayerId);
    },
    getById(id) {
      return this.layers.find((l) => l.id === id);
    },
    getActiveIndex() {
      return this.layers.findIndex((l) => l.id === this.activeLayerId);
    },

    // ─── Internal side effects ──────────────────
    _render() {
      renderLayerList();
    },
    _persist() {
      persistCanvas();
    },
    _notify() {
      this._render();
      this._persist();
      updateHistoryButtons();
    },

    // ─── Mutations ───────────────────────────────
    add(name) {
      const id = `layer-${this.nextId++}`;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.className = "layer";
      canvas.dataset.layerId = id;
      layerStack.appendChild(canvas);

      const layer = {
        id,
        canvas,
        ctx,
        name: name || `Layer ${this.nextId - 1}`,
        visible: true,
        opacity: 1,
        history: [],
        redoStack: [],
      };

      const stackRect = layerStack.getBoundingClientRect();
      if (stackRect.width && stackRect.height) {
        canvas.width = Math.floor(stackRect.width * DPR);
        canvas.height = Math.floor(stackRect.height * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      layer.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

      this.layers.push(layer);
      this.activeLayerId = id;
      canvas.classList.add("active");
      this._notify();
      return layer;
    },

    remove(id) {
      const idx = this.layers.findIndex((l) => l.id === id);
      if (idx === -1 || this.layers.length <= 1) return;

      const [removed] = this.layers.splice(idx, 1);
      removed.canvas.remove();

      if (this.activeLayerId === id) {
        const newIdx = Math.max(0, idx - 1);
        this.activeLayerId = this.layers[newIdx].id;
      }

      this.layers.forEach((l) => {
        l.canvas.classList.toggle("active", l.id === this.activeLayerId);
      });
      this._notify();
    },

    setActive(id) {
      if (!this.getById(id)) return;
      if (this.activeLayerId === id) {
        // Still update classes even if same id
        this.layers.forEach((l) => {
          l.canvas.classList.toggle("active", l.id === id);
        });
        return;
      }
      this.activeLayerId = id;
      this.layers.forEach((l) => {
        l.canvas.classList.toggle("active", l.id === id);
      });
      document.body.classList.toggle(
        "tool-move-bg",
        selectedTool === "move-bg",
      );
      this._notify();
    },

    rename(id, newName) {
      const layer = this.getById(id);
      if (!layer) return;
      const trimmed = (newName || "").trim();
      if (!trimmed) return;
      layer.name = trimmed;
      this._render();
      this._persist();
    },

    toggleVisible(id) {
      const layer = this.getById(id);
      if (!layer) return;
      layer.visible = !layer.visible;
      layer.canvas.style.display = layer.visible ? "" : "none";
      this._render();
      this._persist();
    },

    setOpacity(id, opacity) {
      const layer = this.getById(id);
      if (!layer) return;
      layer.opacity = Math.max(0, Math.min(1, opacity));
      layer.canvas.style.opacity = layer.opacity;
      this._render();
      this._persist();
    },

    duplicate(id) {
      const source = this.getById(id);
      if (!source) return;

      const dup = this.add(source.name + " copy");
      dup.ctx.clearRect(0, 0, dup.canvas.width, dup.canvas.height);
      dup.ctx.drawImage(
        source.canvas,
        0,
        0,
        dup.canvas.width,
        dup.canvas.height,
      );
      dup.history = [];
      dup.history.push(
        dup.ctx.getImageData(0, 0, dup.canvas.width, dup.canvas.height),
      );
      this.setActive(dup.id);
      return dup;
    },

    clear() {
      this.layers.forEach((l) => l.canvas.remove());
      this.layers = [];
      this.activeLayerId = null;
      this.nextId = 1;
    },

    serialize() {
      return {
        activeIndex: Math.max(0, this.getActiveIndex()),
        layers: this.layers.map((l) => ({
          name: l.name,
          visible: l.visible,
          opacity: l.opacity,
          dataURL: l.canvas.toDataURL("image/png"),
        })),
      };
    },

    async deserialize(data) {
      this.clear();

      const stackRect = layerStack.getBoundingClientRect();
      const w = stackRect.width;
      const h = stackRect.height;

      for (let i = 0; i < data.layers.length; i++) {
        const meta = data.layers[i];
        const id = `layer-${this.nextId++}`;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.className = "layer";
        canvas.dataset.layerId = id;
        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        layerStack.appendChild(canvas);

        const layer = {
          id,
          canvas,
          ctx,
          name: meta.name || `Layer ${i + 1}`,
          visible: meta.visible !== false,
          opacity: typeof meta.opacity === "number" ? meta.opacity : 1,
          history: [],
          redoStack: [],
        };

        if (!layer.visible) canvas.style.display = "none";
        canvas.style.opacity = layer.opacity;

        if (meta.dataURL) {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, w, h);
              resolve();
            };
            img.onerror = resolve;
            img.src = meta.dataURL;
          });
        }

        layer.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

        this.layers.push(layer);
      }

      const safeIndex = Math.max(
        0,
        Math.min(data.activeIndex || 0, this.layers.length - 1),
      );
      this.activeLayerId = this.layers[safeIndex].id;
      this.layers.forEach((l) => {
        l.canvas.classList.toggle("active", l.id === this.activeLayerId);
      });
    },
  };

  // ---------- Layer helpers ----------
  function getActiveLayer() {
    return LayerStore.getActive();
  }
  function getActiveCanvas() {
    const l = LayerStore.getActive();
    return l ? l.canvas : null;
  }
  function getActiveCtx() {
    const l = LayerStore.getActive();
    return l ? l.ctx : null;
  }

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  function getCurrentTheme() {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    const settings = Storage.loadSettings() || {};
    settings.theme = next;
    Storage.saveSettings(settings);
  }

  // ---------- Layer Panel UI ----------
  function renderLayerList() {
    // Don't re-render while renaming
    if (isRenamingLayer) return;
    if (layerList.querySelector(".layer-name-input")) return;

    layerList.innerHTML = "";

    [...LayerStore.layers].reverse().forEach((layer) => {
      const item = document.createElement("div");
      item.className =
        "layer-item" + (layer.id === LayerStore.activeLayerId ? " active" : "");
      item.dataset.layerId = layer.id;

      // Eye button
      const eyeBtn = document.createElement("button");
      eyeBtn.type = "button";
      eyeBtn.className = "layer-btn" + (layer.visible ? "" : " eye-off");
      eyeBtn.title = layer.visible ? "Hide" : "Show";
      eyeBtn.innerHTML = layer.visible
        ? `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`;
      eyeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        LayerStore.toggleVisible(layer.id);
      });

      // Name
      const nameEl = document.createElement("span");
      nameEl.className = "layer-name";
      nameEl.textContent = layer.name;
      nameEl.title = "Double-click to rename";
      nameEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        startRenameLayer(layer.id, nameEl);
      });

      // Delete
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "layer-btn";
      delBtn.title = "Delete layer";
      delBtn.innerHTML = `<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg>`;
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (LayerStore.layers.length <= 1) {
          alert("You need at least one layer.");
          return;
        }
        if (!confirm(`Delete "${layer.name}"?`)) return;
        LayerStore.remove(layer.id);
      });

      item.appendChild(eyeBtn);
      item.appendChild(nameEl);
      item.appendChild(delBtn);

      item.addEventListener("click", () => {
        LayerStore.setActive(layer.id);
      });

      layerList.appendChild(item);
    });

    // Update opacity slider
    const active = LayerStore.getActive();
    if (active) {
      layerOpacity.value = Math.round(active.opacity * 100);
      layerOpacityLabel.textContent = Math.round(active.opacity * 100) + "%";
    }
  }

  function startRenameLayer(layerId, nameEl) {
    if (isRenamingLayer) return;
    const layer = LayerStore.getById(layerId);
    if (!layer) return;

    isRenamingLayer = true;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-name-input";
    input.value = layer.name;
    input.maxLength = 30;

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;
    const finish = (save) => {
      if (committed) return;
      committed = true;
      isRenamingLayer = false;

      if (save) {
        const newName = input.value.trim() || layer.name;
        layer.name = newName;
        persistCanvas();
      }
      renderLayerList();
    };

    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });

    input.addEventListener("blur", () => finish(true), { once: true });
  }

  // ---------- Canvas Setup ----------
  function resizeLayerCanvas(layer, preserveContent) {
    const stackRect = layerStack.getBoundingClientRect();
    if (!stackRect.width || !stackRect.height) return;

    const canvas = layer.canvas;
    const ctx = layer.ctx;

    let prev = null;
    if (preserveContent && canvas.width && canvas.height) {
      try {
        prev = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        prev = null;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    canvas.width = Math.floor(stackRect.width * DPR);
    canvas.height = Math.floor(stackRect.height * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (prev) {
      const off = document.createElement("canvas");
      off.width = prev.width;
      off.height = prev.height;
      off.getContext("2d").putImageData(prev, 0, 0);
      ctx.drawImage(
        off,
        0,
        0,
        prev.width,
        prev.height,
        0,
        0,
        stackRect.width,
        stackRect.height,
      );
    }
  }

  function setupCanvas(preserveContent = true) {
    LayerStore.layers.forEach((l) => resizeLayerCanvas(l, preserveContent));
    updateBgOverlay();
  }

  // ---------- Colors UI ----------
  function buildColorSwatches() {
    PALETTE.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "swatch w-full aspect-square rounded-full border border-white/10 transition hover:scale-110" +
        (i === 0 ? " selected" : "");
      b.style.background = c;
      b.dataset.color = c;
      b.setAttribute("aria-label", `Color ${c}`);
      colorRow.appendChild(b);
    });

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = "#3b82f6";
    picker.className =
      "w-full aspect-square rounded-full border border-dashed border-white/20 cursor-pointer bg-transparent p-0";
    picker.title = "Custom color";
    colorRow.appendChild(picker);

    colorRow.addEventListener("click", (e) => {
      const b = e.target.closest(".swatch");
      if (!b) return;
      colorRow
        .querySelectorAll(".swatch")
        .forEach((s) => s.classList.remove("selected"));
      b.classList.add("selected");
      selectedColor = b.dataset.color;
      persistSettings();
    });

    picker.addEventListener("input", () => {
      colorRow
        .querySelectorAll(".swatch")
        .forEach((s) => s.classList.remove("selected"));
      selectedColor = picker.value;
      persistSettings();
    });
  }

  // ---------- Tools ----------
  function bindTools() {
    toolBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        if (textInputEl) closeTextInput();
        document.querySelector(".tool-btn.active")?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.dataset.tool;

        document.body.classList.toggle(
          "tool-move-bg",
          selectedTool === "move-bg",
        );

        updateBgOverlay();
        persistSettings();
      }),
    );

    sizeSlider.addEventListener("input", () => {
      brushWidth = +sizeSlider.value;
      sizeLabel.textContent = brushWidth + "px";
      persistSettings();
    });

    fillColor.addEventListener("change", persistSettings);
  }

  // ---------- Clear Active Layer ----------
  function clearActiveLayer() {
    const ctx = getActiveCtx();
    const canvas = getActiveCanvas();
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // ---------- History (per-layer) ----------
  function pushHistory() {
    const layer = LayerStore.getActive();
    if (!layer) return;
    const { canvas, ctx, history, redoStack } = layer;

    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > MAX_HISTORY) history.shift();
    redoStack.length = 0;

    updateHistoryButtons();
    persistCanvas();
  }

  function updateHistoryButtons() {
    const layer = LayerStore.getActive();
    if (!layer) {
      undoBtn.disabled = true;
      redoBtn.disabled = true;
      return;
    }
    undoBtn.disabled = layer.history.length <= 1;
    redoBtn.disabled = layer.redoStack.length === 0;
  }

  function bindHistory() {
    undoBtn.addEventListener("click", () => {
      const layer = LayerStore.getActive();
      if (!layer) return;
      const { ctx, history, redoStack } = layer;
      if (history.length <= 1) return;
      redoStack.push(history.pop());
      ctx.putImageData(history[history.length - 1], 0, 0);
      updateHistoryButtons();
      persistCanvas();
    });

    redoBtn.addEventListener("click", () => {
      const layer = LayerStore.getActive();
      if (!layer) return;
      const { ctx, history, redoStack } = layer;
      if (!redoStack.length) return;
      const next = redoStack.pop();
      history.push(next);
      ctx.putImageData(next, 0, 0);
      updateHistoryButtons();
      persistCanvas();
    });
  }

  // ---------- Helpers ----------
  function getPos(e) {
    const canvas = getActiveCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // ---------- Shapes ----------
  function drawRect(x, y) {
    const ctx = getActiveCtx();
    if (!ctx) return;
    const w = startX - x;
    const h = startY - y;
    ctx.beginPath();
    if (fillColor.checked) {
      ctx.fillRect(
        Math.min(x, startX),
        Math.min(y, startY),
        Math.abs(w),
        Math.abs(h),
      );
    } else {
      ctx.strokeRect(
        Math.min(x, startX),
        Math.min(y, startY),
        Math.abs(w),
        Math.abs(h),
      );
    }
  }

  function drawCircle(x, y) {
    const ctx = getActiveCtx();
    if (!ctx) return;
    const r = Math.hypot(startX - x, startY - y);
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    fillColor.checked ? ctx.fill() : ctx.stroke();
  }

  function drawTriangle(x, y) {
    const ctx = getActiveCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.lineTo(startX * 2 - x, y);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
  }

  function drawLine(x, y) {
    const ctx = getActiveCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function drawArrow(x, y) {
    const ctx = getActiveCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.stroke();

    const headLength = Math.max(12, brushWidth * 2.5);
    const angle = Math.atan2(y - startY, x - startX);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle - Math.PI / 7),
      y - headLength * Math.sin(angle - Math.PI / 7),
    );
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle + Math.PI / 7),
      y - headLength * Math.sin(angle + Math.PI / 7),
    );
    ctx.stroke();
  }

  // ---------- Text Tool ----------
  function openTextInput(e) {
    if (textInputEl) {
      textInputEl.focus();
      return;
    }

    const canvas = getActiveCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const input = document.createElement("input");
    input.type = "text";
    input.id = "textInput";
    input.placeholder = "Type & press Enter…";
    input.maxLength = 100;

    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.fontSize = Math.max(14, brushWidth * 2.5) + "px";
    input.style.color = selectedColor;

    canvasWrapper.appendChild(input);
    input.focus();
    textInputEl = input;

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commitText(x, y, input.value);
        closeTextInput();
      } else if (ev.key === "Escape") {
        closeTextInput();
      }
    });

    input.addEventListener("blur", () => {
      if (input.value.trim()) {
        commitText(x, y, input.value);
      }
      closeTextInput();
    });
  }

  function commitText(x, y, text) {
    if (!text || !text.trim()) return;
    const ctx = getActiveCtx();
    if (!ctx) return;

    const fontSize = Math.max(14, brushWidth * 2.5);
    ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = selectedColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x, y);
    pushHistory();
  }

  function closeTextInput() {
    if (!textInputEl) return;
    textInputEl.remove();
    textInputEl = null;
  }

  // ---------- Flood Fill ----------
  function floodFill(cssX, cssY, fillColorHex) {
    const canvas = getActiveCanvas();
    const ctx = getActiveCtx();
    if (!canvas || !ctx) return;

    const x = Math.floor(cssX * DPR);
    const y = Math.floor(cssY * DPR);
    const W = canvas.width;
    const H = canvas.height;

    if (x < 0 || y < 0 || x >= W || y >= H) return;

    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    const target = hexToRgba(fillColorHex);
    if (!target) return;

    const idx = (y * W + x) * 4;
    const startColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];

    if (colorsEqual(startColor, target)) return;

    const stack = [[x, y]];
    const visited = new Uint8Array(W * H);
    const tolerance = 30;

    function matches(pos) {
      const i = pos * 4;
      return (
        Math.abs(data[i] - startColor[0]) <= tolerance &&
        Math.abs(data[i + 1] - startColor[1]) <= tolerance &&
        Math.abs(data[i + 2] - startColor[2]) <= tolerance &&
        Math.abs(data[i + 3] - startColor[3]) <= tolerance
      );
    }

    while (stack.length) {
      const [cx, cy] = stack.pop();
      const pos = cy * W + cx;
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
      if (visited[pos]) continue;
      if (!matches(pos)) continue;

      visited[pos] = 1;
      const i = pos * 4;
      data[i] = target[0];
      data[i + 1] = target[1];
      data[i + 2] = target[2];
      data[i + 3] = target[3];

      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function hexToRgba(hex) {
    if (!hex) return null;
    hex = hex.replace("#", "").trim();
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b, 255];
  }

  function colorsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  // ---------- Background Image ----------
  function handleBackgroundUpload(file) {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const compressed = compressImage(img, 1200, 0.75);
        backgroundDataURL = compressed;
        applyBackgroundToLayer(compressed);

        const ok = Storage.saveBackground(compressed);
        if (!ok) {
          alert(
            "Image is too large to save. It will still work for this session.",
          );
        }

        clearBgBtn.classList.remove("hidden");
        bgControls.classList.remove("hidden");
        setTimeout(updateBgOverlay, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function compressImage(img, maxSize, quality) {
    const c = document.createElement("canvas");
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w = Math.floor(w * ratio);
      h = Math.floor(h * ratio);
    }
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", quality);
  }

  function applyBackgroundToLayer(dataURL) {
    if (!dataURL) {
      bgLayer.classList.add("hidden");
      bgLayer.removeAttribute("src");
      bgOverlay.classList.add("hidden");
      return;
    }
    bgLayer.src = dataURL;
    bgLayer.classList.remove("hidden");
    applyBgTransform();
  }

  function applyBgTransform() {
    bgLayer.style.transform = `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${bgTransform.scale * bgTransform.flipH}, ${bgTransform.scale * bgTransform.flipV}) rotate(${bgTransform.rotation}deg)`;
    Storage.saveBgTransform(bgTransform);
    updateBgOverlay();
  }

  // ---------- Overlay (Resize / Rotate) ----------
  function updateBgOverlay() {
    if (selectedTool !== "move-bg" || !backgroundDataURL) {
      bgOverlay.classList.add("hidden");
      return;
    }

    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const w = wrapperRect.width;
    const h = wrapperRect.height;

    if (!bgLayer.naturalWidth || !bgLayer.naturalHeight) {
      bgOverlay.classList.add("hidden");
      return;
    }

    const iw = bgLayer.naturalWidth;
    const ih = bgLayer.naturalHeight;
    const fitScale = Math.min(w / iw, h / ih);
    const baseWidth = iw * fitScale;
    const baseHeight = ih * fitScale;
    const finalWidth = baseWidth * bgTransform.scale;
    const finalHeight = baseHeight * bgTransform.scale;

    const cx = w / 2 + bgTransform.x;
    const cy = h / 2 + bgTransform.y;
    const rad = (bgTransform.rotation * Math.PI) / 180;
    const hw = finalWidth / 2;
    const hh = finalHeight / 2;

    function rot(px, py) {
      const dx = px - cx;
      const dy = py - cy;
      return {
        x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      };
    }

    const corners = {
      tl: rot(cx - hw, cy - hh),
      tr: rot(cx + hw, cy - hh),
      bl: rot(cx - hw, cy + hh),
      br: rot(cx + hw, cy + hh),
    };

    const points = [corners.tl, corners.tr, corners.br, corners.bl]
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
    bgBBox.setAttribute("points", points);
    bgOverlay.setAttribute("viewBox", `0 0 ${w} ${h}`);

    handleTL.setAttribute("cx", corners.tl.x);
    handleTL.setAttribute("cy", corners.tl.y);
    handleTR.setAttribute("cx", corners.tr.x);
    handleTR.setAttribute("cy", corners.tr.y);
    handleBL.setAttribute("cx", corners.bl.x);
    handleBL.setAttribute("cy", corners.bl.y);
    handleBR.setAttribute("cx", corners.br.x);
    handleBR.setAttribute("cy", corners.br.y);

    const topMidX = (corners.tl.x + corners.tr.x) / 2;
    const topMidY = (corners.tl.y + corners.tr.y) / 2;
    const edgeDx = corners.tr.x - corners.tl.x;
    const edgeDy = corners.tr.y - corners.tl.y;
    const edgeLen = Math.hypot(edgeDx, edgeDy) || 1;
    const perpX = edgeDy / edgeLen;
    const perpY = -edgeDx / edgeLen;

    const rhX = topMidX + perpX * 35;
    const rhY = topMidY + perpY * 35;

    rotateHandle.setAttribute("cx", rhX);
    rotateHandle.setAttribute("cy", rhY);
    rotateLine.setAttribute("x1", topMidX);
    rotateLine.setAttribute("y1", topMidY);
    rotateLine.setAttribute("x2", rhX);
    rotateLine.setAttribute("y2", rhY);

    bgOverlay.classList.remove("hidden");
  }

  function bindResizeHandles() {
    const handles = [handleTL, handleTR, handleBL, handleBR];

    handles.forEach((handle) => {
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!backgroundDataURL) return;

        isResizingBg = true;
        handle.setPointerCapture(e.pointerId);

        const { cx, cy } = getImageCenterClient();
        resizeStart.centerX = cx;
        resizeStart.centerY = cy;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        resizeStart.distance = Math.max(1, Math.hypot(dx, dy));
        resizeStart.scale = bgTransform.scale;
      });

      handle.addEventListener("pointermove", (e) => {
        if (!isResizingBg) return;
        e.preventDefault();

        const dx = e.clientX - resizeStart.centerX;
        const dy = e.clientY - resizeStart.centerY;
        const newDistance = Math.max(1, Math.hypot(dx, dy));

        const ratio = newDistance / resizeStart.distance;
        const newScale = Math.max(0.2, Math.min(6, resizeStart.scale * ratio));
        bgTransform.scale = newScale;
        applyBgTransform();
      });

      const endResize = (e) => {
        if (!isResizingBg) return;
        isResizingBg = false;
        try {
          handle.releasePointerCapture(e.pointerId);
        } catch {}
      };

      handle.addEventListener("pointerup", endResize);
      handle.addEventListener("pointercancel", endResize);
    });

    rotateHandle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!backgroundDataURL) return;

      isRotatingBg = true;
      rotateHandle.setPointerCapture(e.pointerId);

      const { cx, cy } = getImageCenterClient();
      rotateStart.centerX = cx;
      rotateStart.centerY = cy;
      rotateStart.angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      rotateStart.rotation = bgTransform.rotation;
    });

    rotateHandle.addEventListener("pointermove", (e) => {
      if (!isRotatingBg) return;
      e.preventDefault();

      const angle = Math.atan2(
        e.clientY - rotateStart.centerY,
        e.clientX - rotateStart.centerX,
      );
      const deltaDeg = ((angle - rotateStart.angle) * 180) / Math.PI;
      let newRotation = rotateStart.rotation + deltaDeg;

      if (e.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
      if (newRotation > 180) newRotation -= 360;
      if (newRotation < -180) newRotation += 360;

      bgTransform.rotation = newRotation;
      applyBgTransform();
    });

    const endRotate = (e) => {
      if (!isRotatingBg) return;
      isRotatingBg = false;
      try {
        rotateHandle.releasePointerCapture(e.pointerId);
      } catch {}
    };

    rotateHandle.addEventListener("pointerup", endRotate);
    rotateHandle.addEventListener("pointercancel", endRotate);
  }

  function getImageCenterClient() {
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const w = wrapperRect.width;
    const h = wrapperRect.height;
    const cx = wrapperRect.left + w / 2 + bgTransform.x;
    const cy = wrapperRect.top + h / 2 + bgTransform.y;
    return { cx, cy };
  }

  function resetBgTransform() {
    bgTransform = { x: 0, y: 0, scale: 1, rotation: 0, flipH: 1, flipV: 1 };
    applyBgTransform();
    bgOverlay.classList.remove("snapped-x", "snapped-y");
  }

  function zoomBg(factor) {
    const newScale = Math.max(0.2, Math.min(6, bgTransform.scale * factor));
    bgTransform.scale = newScale;
    applyBgTransform();
  }

  function loadBgTransform() {
    const saved = Storage.loadBgTransform();
    if (saved && typeof saved.x === "number") {
      bgTransform = {
        x: saved.x || 0,
        y: saved.y || 0,
        scale: saved.scale || 1,
        rotation: saved.rotation || 0,
        flipH: saved.flipH || 1,
        flipV: saved.flipV || 1,
      };
    } else {
      bgTransform = { x: 0, y: 0, scale: 1, rotation: 0, flipH: 1, flipV: 1 };
    }
    applyBgTransform();
  }

  function removeBackground() {
    backgroundDataURL = null;
    Storage.clearBackground();
    Storage.clearBgTransform();
    resetBgTransform();
    applyBackgroundToLayer(null);
    clearBgBtn.classList.add("hidden");
    bgControls.classList.add("hidden");
    bgOverlay.classList.add("hidden");
  }

  // ---------- Pointer Events ----------
  function bindDrawing() {
    layerStack.addEventListener("pointerdown", (e) => {
      const canvas = getActiveCanvas();
      if (!canvas) return;

      if (selectedTool === "move-bg") {
        if (!backgroundDataURL) return;
        e.preventDefault();
        isPanningBg = true;
        bgPanStart.x = e.clientX - bgTransform.x;
        bgPanStart.y = e.clientY - bgTransform.y;
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      if (selectedTool === "text") {
        e.preventDefault();
        openTextInput(e);
        return;
      }

      if (selectedTool === "fill") {
        e.preventDefault();
        const { x, y } = getPos(e);
        floodFill(x, y, selectedColor);
        pushHistory();
        return;
      }

      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      const { x, y } = getPos(e);
      startX = x;
      startY = y;

      const ctx = getActiveCtx();
      ctx.lineWidth = brushWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = selectedColor;

      if (selectedTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = selectedColor;
      }

      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    });

    layerStack.addEventListener("pointermove", (e) => {
      if (isPanningBg) {
        let newX = e.clientX - bgPanStart.x;
        let newY = e.clientY - bgPanStart.y;

        if (Math.abs(newX) < SNAP_THRESHOLD) {
          newX = 0;
          bgOverlay.classList.add("snapped-x");
        } else {
          bgOverlay.classList.remove("snapped-x");
        }
        if (Math.abs(newY) < SNAP_THRESHOLD) {
          newY = 0;
          bgOverlay.classList.add("snapped-y");
        } else {
          bgOverlay.classList.remove("snapped-y");
        }

        bgTransform.x = newX;
        bgTransform.y = newY;
        applyBgTransform();
        return;
      }

      if (!isDrawing) return;
      const ctx = getActiveCtx();
      const canvas = getActiveCanvas();
      if (!ctx || !canvas) return;

      const { x, y } = getPos(e);
      ctx.putImageData(snapshot, 0, 0);

      if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        startX = x;
        startY = y;
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else if (selectedTool === "rectangle") {
        drawRect(x, y);
      } else if (selectedTool === "circle") {
        drawCircle(x, y);
      } else if (selectedTool === "triangle") {
        drawTriangle(x, y);
      } else if (selectedTool === "line") {
        drawLine(x, y);
      } else if (selectedTool === "arrow") {
        drawArrow(x, y);
      }
    });

    const endDraw = () => {
      if (isPanningBg) {
        isPanningBg = false;
        bgOverlay.classList.remove("snapped-x", "snapped-y");
        return;
      }
      if (isRotatingBg) {
        isRotatingBg = false;
        return;
      }
      if (isResizingBg) {
        isResizingBg = false;
        return;
      }
      if (!isDrawing) return;
      isDrawing = false;

      const ctx = getActiveCtx();
      if (ctx) ctx.globalCompositeOperation = "source-over";

      pushHistory();
    };

    layerStack.addEventListener("pointerup", endDraw);
    layerStack.addEventListener("pointercancel", endDraw);
    layerStack.addEventListener("pointerleave", endDraw);
  }

  // ---------- Actions ----------
  function bindActions() {
    themeToggle?.addEventListener("click", toggleTheme);
    document.getElementById("clear").addEventListener("click", () => {
      clearActiveLayer();
      pushHistory();
    });

    bgFlipHBtn.addEventListener("click", () => {
      if (!backgroundDataURL) return;
      bgTransform.flipH *= -1;
      applyBgTransform();
    });

    bgFlipVBtn.addEventListener("click", () => {
      if (!backgroundDataURL) return;
      bgTransform.flipV *= -1;
      applyBgTransform();
    });

    bgUpload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleBackgroundUpload(file);
      e.target.value = "";
    });

    clearBgBtn.addEventListener("click", () => {
      if (!backgroundDataURL) return;
      if (!confirm("Remove the imported image?")) return;
      removeBackground();
    });

    addLayerBtn.addEventListener("click", () => {
      LayerStore.add();
    });

    layerOpacity.addEventListener("input", () => {
      const active = LayerStore.getActive();
      if (!active) return;
      const val = +layerOpacity.value;
      LayerStore.setOpacity(active.id, val / 100);
      layerOpacityLabel.textContent = val + "%";
    });

    document.getElementById("bgZoomIn").addEventListener("click", () => {
      if (!backgroundDataURL) return;
      zoomBg(1.15);
    });
    document.getElementById("bgZoomOut").addEventListener("click", () => {
      if (!backgroundDataURL) return;
      zoomBg(1 / 1.15);
    });
    document.getElementById("bgReset").addEventListener("click", () => {
      if (!backgroundDataURL) return;
      resetBgTransform();
    });

    canvasWrapper.addEventListener(
      "wheel",
      (e) => {
        if (selectedTool !== "move-bg" || !backgroundDataURL) return;
        e.preventDefault();
        zoomBg(e.deltaY > 0 ? 0.9 : 1.1);
      },
      { passive: false },
    );

    document.getElementById("save").addEventListener("click", () => {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const rect = activeCanvas.getBoundingClientRect();
      const dpr = activeCanvas.width / rect.width;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = activeCanvas.width;
      exportCanvas.height = activeCanvas.height;
      const exCtx = exportCanvas.getContext("2d");

      exCtx.fillStyle = "#ffffff";
      exCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      const finishExport = () => {
        LayerStore.layers.forEach((layer) => {
          if (!layer.visible) return;
          exCtx.globalAlpha = layer.opacity;
          exCtx.drawImage(layer.canvas, 0, 0);
        });
        exCtx.globalAlpha = 1;

        const link = document.createElement("a");
        link.download = `poyberpaint-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
      };

      if (backgroundDataURL) {
        const img = new Image();
        img.onload = () => {
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const fitScale = Math.min(rect.width / iw, rect.height / ih) * dpr;

          const dw =
            iw * fitScale * bgTransform.scale * Math.abs(bgTransform.flipH);
          const dh =
            ih * fitScale * bgTransform.scale * Math.abs(bgTransform.flipV);

          const cx = exportCanvas.width / 2 + bgTransform.x * dpr;
          const cy = exportCanvas.height / 2 + bgTransform.y * dpr;

          exCtx.save();
          exCtx.translate(cx, cy);
          exCtx.rotate((bgTransform.rotation * Math.PI) / 180);
          exCtx.scale(bgTransform.flipH, bgTransform.flipV);
          exCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          exCtx.restore();

          finishExport();
        };
        img.src = backgroundDataURL;
      } else {
        finishExport();
      }
    });

    document.getElementById("reset").addEventListener("click", () => {
      if (
        !confirm("This will clear your saved drawing and settings. Continue?")
      )
        return;
      Storage.clearCanvas();
      Storage.saveSettings({});
      localStorage.removeItem("poyberpaint:layers");
      location.reload();
    });
  }

  // ---------- Keyboard ----------
  function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") {
        if (e.key === "Escape" && textInputEl) {
          closeTextInput();
          e.preventDefault();
        }
        return;
      }

      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl) {
        if (k === "z" && !e.shiftKey) {
          e.preventDefault();
          undoBtn.click();
          return;
        }
        if (k === "y" || (k === "z" && e.shiftKey)) {
          e.preventDefault();
          redoBtn.click();
          return;
        }
        if (k === "s") {
          e.preventDefault();
          document.getElementById("save").click();
          return;
        }
        return;
      }

      if (e.shiftKey && k === "n") {
        e.preventDefault();
        LayerStore.add();
        return;
      }
      if (e.shiftKey && k === "d") {
        e.preventDefault();
        const active = LayerStore.getActive();
        if (active) LayerStore.duplicate(active.id);
        return;
      }

      if (e.key === "Escape") {
        if (textInputEl) {
          closeTextInput();
          e.preventDefault();
        }
        return;
      }

      if (TOOL_KEYS[k]) {
        const targetBtn = document.querySelector(
          `.tool-btn[data-tool="${TOOL_KEYS[k]}"]`,
        );
        if (targetBtn) {
          targetBtn.click();
          e.preventDefault();
        }
        return;
      }

      if (k >= "1" && k <= "9") {
        const idx = parseInt(k, 10) - 1;
        const swatches = colorRow.querySelectorAll(".swatch");
        if (swatches[idx]) {
          swatches[idx].click();
          e.preventDefault();
        }
        return;
      }

      if (e.key === "[") {
        const newVal = Math.max(1, brushWidth - 1);
        sizeSlider.value = newVal;
        sizeSlider.dispatchEvent(new Event("input", { bubbles: true }));
        e.preventDefault();
        return;
      }
      if (e.key === "]") {
        const newVal = Math.min(60, brushWidth + 1);
        sizeSlider.value = newVal;
        sizeSlider.dispatchEvent(new Event("input", { bubbles: true }));
        e.preventDefault();
        return;
      }

      if (k === "0") {
        if (backgroundDataURL) {
          resetBgTransform();
          e.preventDefault();
        }
        return;
      }
    });
  }

  // ---------- Utils ----------
  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function showSaved() {
    if (!saveIndicator) return;
    saveIndicator.style.opacity = "1";
    clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(() => {
      saveIndicator.style.opacity = "0";
    }, 1200);
  }

  // ---------- Persist ----------
  function persistCanvas() {
    if (!Storage.available) return;
    if (!LayerStore.layers.length) return;

    try {
      const data = LayerStore.serialize();
      localStorage.setItem("poyberpaint:layers", JSON.stringify(data));

      const active = LayerStore.getActive();
      if (active) {
        Storage.saveCanvas(active.canvas.toDataURL("image/png"));
      }
      showSaved();
    } catch (e) {
      console.warn("Failed to save layers:", e);
    }
  }

  function persistSettings() {
    if (!Storage.available) return;
    Storage.saveSettings({
      tool: selectedTool,
      color: selectedColor,
      width: brushWidth,
      fill: fillColor.checked,
      theme: getCurrentTheme(),
    });
  }

  // ---------- Load ----------
  function loadSavedState() {
    const settings = Storage.loadSettings();
    if (settings?.theme) applyTheme(settings.theme);
    if (!settings) return;

    selectedTool = settings.tool || "brush";
    selectedColor = settings.color || "#000000";
    brushWidth = settings.width || 5;
    fillColor.checked = !!settings.fill;

    sizeSlider.value = brushWidth;
    sizeLabel.textContent = brushWidth + "px";

    document.querySelectorAll(".tool-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === selectedTool);
    });
    document.querySelectorAll(".swatch").forEach((s) => {
      s.classList.toggle("selected", s.dataset.color === selectedColor);
    });

    document.body.classList.toggle("tool-move-bg", selectedTool === "move-bg");
  }

  async function loadSavedCanvas() {
    const raw = Storage.available
      ? localStorage.getItem("poyberpaint:layers")
      : null;

    if (!raw) return false;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }

    if (!parsed?.layers?.length) return false;

    await LayerStore.deserialize(parsed);
    updateHistoryButtons();
    renderLayerList();
    return true;
  }

  // ---------- Init ----------
  async function init() {
    buildColorSwatches();
    loadSavedState();
    bindTools();
    bindHistory();
    bindDrawing();
    bindActions();
    bindKeyboard();
    bindResizeHandles();

    const loaded = await loadSavedCanvas();

    if (!loaded) {
      LayerStore.add("Layer 1");
    }

    setupCanvas(false);

    const bgData = Storage.loadBackground();
    if (bgData) {
      applyBackgroundToLayer(bgData);
      backgroundDataURL = bgData;
      clearBgBtn.classList.remove("hidden");
      bgControls.classList.remove("hidden");
      loadBgTransform();
      updateBgOverlay();
    }

    renderLayerList();
    showSaved();

    window.addEventListener(
      "resize",
      debounce(() => {
        setupCanvas();
        updateBgOverlay();
      }, 200),
    );
  }

  window.addEventListener("load", init);
})();
