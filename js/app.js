/**
 * PoyberPaint — A Modern Paint & Drawing Web App.
 * @author AshkanPoyber
 * @version 1.1.0
 */

(() => {
  "use strict";

  // ---------- DOM ----------
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

  // ---------- State ----------
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
  let bgTransform = { x: 0, y: 0, scale: 1 };
  let isPanningBg = false;
  let bgPanStart = { x: 0, y: 0 };

  const history = [];
  const redoStack = [];

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
    // Save into existing settings object
    const settings = Storage.loadSettings() || {};
    settings.theme = next;
    Storage.saveSettings(settings);
    // Redraw white background so canvas matches theme visually (optional)
    // we keep canvas white regardless — pure UX choice
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

        // Update cursor class for move-bg
        document.body.classList.toggle(
          "tool-move-bg",
          selectedTool === "move-bg",
        );

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

  // ---------- Canvas Setup ----------
  function setupCanvas(preserveContent = true) {
    const rect = canvas.getBoundingClientRect();

    // Preserve previous drawing when resizing
    let prev = null;
    if (preserveContent && canvas.width && canvas.height) {
      try {
        prev = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        prev = null;
      }
    }

    // Reset transform, resize backing store
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.height * DPR);

    // Scale context to CSS pixels
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Restore previous content (draw scaled to fit)
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
        rect.width,
        rect.height,
      );
    }
  }

  function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
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
        // Compress for storage
        const compressed = compressImage(img, 1200, 0.75);

        backgroundDataURL = compressed;

        // Apply to DOM layer (not canvas)
        applyBackgroundToLayer(compressed);

        // Save
        const ok = Storage.saveBackground(compressed);
        if (!ok) {
          alert(
            "Image is too large to save. It will still work for this session.",
          );
        }

        // Show remove button
        clearBgBtn.classList.remove("hidden");
        bgControls.classList.remove("hidden");

        // Push history so background persists across undo/redo
        pushHistory();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function compressImage(img, maxSize, quality) {
    const canvas = document.createElement("canvas");
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    // Scale down if larger than maxSize
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w = Math.floor(w * ratio);
      h = Math.floor(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    c.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  }

  function applyBackgroundToLayer(dataURL) {
    if (!dataURL) {
      bgLayer.classList.add("hidden");
      bgLayer.removeAttribute("src");
      return;
    }
    bgLayer.src = dataURL;
    bgLayer.classList.remove("hidden");
    applyBgTransform();
  }

  // ---------- Background Transform ----------
  function applyBgTransform() {
    bgLayer.style.transform = `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${bgTransform.scale})`;
    Storage.saveBgTransform(bgTransform);
  }

  function resetBgTransform() {
    bgTransform = { x: 0, y: 0, scale: 1 };
    applyBgTransform();
  }

  function zoomBg(factor) {
    const newScale = Math.max(0.3, Math.min(5, bgTransform.scale * factor));
    bgTransform.scale = newScale;
    applyBgTransform();
  }

  function loadBgTransform() {
    const saved = Storage.loadBgTransform();
    if (saved && typeof saved.x === "number") {
      bgTransform = saved;
    } else {
      bgTransform = { x: 0, y: 0, scale: 1 };
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
  }

  // ---------- History ----------
  function pushHistory() {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > MAX_HISTORY) history.shift();
    redoStack.length = 0;
    updateHistoryButtons();
    persistCanvas();
  }

  function updateHistoryButtons() {
    undoBtn.disabled = history.length <= 1;
    redoBtn.disabled = redoStack.length === 0;
  }

  function bindHistory() {
    undoBtn.addEventListener("click", () => {
      if (history.length <= 1) return;
      redoStack.push(history.pop());
      ctx.putImageData(history[history.length - 1], 0, 0);
      updateHistoryButtons();
    });

    redoBtn.addEventListener("click", () => {
      if (!redoStack.length) return;
      const next = redoStack.pop();
      history.push(next);
      ctx.putImageData(next, 0, 0);
      updateHistoryButtons();
    });
  }

  // ---------- Helpers ----------
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // ---------- Shapes ----------
  function drawRect(x, y) {
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
    const r = Math.hypot(startX - x, startY - y);
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    fillColor.checked ? ctx.fill() : ctx.stroke();
  }

  function drawTriangle(x, y) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.lineTo(startX * 2 - x, y);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
  }

  // ---------- Line & Arrow ----------
  function drawLine(x, y) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function drawArrow(x, y) {
    // Draw the shaft
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Arrow head geometry
    const headLength = Math.max(12, brushWidth * 2.5);
    const angle = Math.atan2(y - startY, x - startX);

    // Two lines forming the arrowhead
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
    // Don't Open If One Is Already Open
    if (textInputEl) {
      textInputEl.focus();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create Input
    const input = document.createElement("input");
    input.type = "text";
    input.id = "textInput";
    input.placeholder = "Type & press Enter…";
    input.maxLength = 100;

    // Position It
    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.fontSize = Math.max(14, brushWidth * 2.5) + "px";
    input.style.color = selectedColor;

    // Append To Canvas Wrapper (Relative Positioned )
    canvasWrapper.appendChild(input);
    input.focus();

    textInputEl = input;

    // Commit On Enter
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commitText(x, y, input.value);
        closeTextInput();
      } else if (ev.key === "Escape") {
        closeTextInput();
      }
    });

    // Commit On Blur ( Click Outside )
    input.addEventListener("blur", () => {
      if (input.value.trim()) {
        commitText(x, y, input.value);
      }
      closeTextInput();
    });
  }

  function commitText(x, y, text) {
    if (!text || !text.trim()) return;

    const fontSize = Math.max(14, brushWidth * 2.5);
    ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = selectedColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.fillText(text, x, y);

    // Push To History & Save
    pushHistory();
  }

  function closeTextInput() {
    if (!textInputEl) return;
    textInputEl.remove();
    textInputEl = null;
  }

  // ---------- Flood Fill ----------
  function floodFill(cssX, cssY, fillColorHex) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(cssX * DPR);
    const y = Math.floor(cssY * DPR);

    const W = canvas.width;
    const H = canvas.height;

    // Bounds Check
    if (x < 0 || y < 0 || x >= W || y >= H) return;

    // Get Oixel Data
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;

    // Helper : Convert Hex To [ r,g,b,a ]
    const target = hexToRgba(fillColorHex);
    if (!target) return;

    // Color At Clicked Pixel
    const idx = (y * W + x) * 4;
    const startColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];

    // If Same Color → Nothing To Do
    if (colorsEqual(startColor, target)) return;

    // BFS With a Stack ( Faster Than Recursion , No Stack Overflow )
    const stack = [[x, y]];
    const visited = new Uint8Array(W * H);
    const tolerance = 30; // Anti-Alias Tolerance

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

      // 4-Way Neighbors
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Hex String → [ r,g,b,a ]
  function hexToRgba(hex) {
    if (!hex) return null;
    hex = hex.replace("#", "").trim();

    // Support #rgb & #rrggbb
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

  // ---------- Pointer Events ----------
  function bindDrawing() {
    canvas.addEventListener("pointerdown", (e) => {
      // 👇 If Move-BG Tool Is Active → Pan The Background
      if (selectedTool === "move-bg") {
        if (!backgroundDataURL) return;
        e.preventDefault();
        isPanningBg = true;
        bgPanStart.x = e.clientX - bgTransform.x;
        bgPanStart.y = e.clientY - bgTransform.y;
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // If Text Tool Is Active → Open Floating Input
      if (selectedTool === "text") {
        e.preventDefault();
        openTextInput(e);
        return;
      }
      // If Fill Tool Is Active → Flood Fill
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

    canvas.addEventListener("pointermove", (e) => {
      // 👇 Pan Background
      if (isPanningBg) {
        bgTransform.x = e.clientX - bgPanStart.x;
        bgTransform.y = e.clientY - bgPanStart.y;
        applyBgTransform();
        return;
      }
      if (!isDrawing) return;
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
        return;
      }
      if (!isDrawing) return;
      isDrawing = false;
      pushHistory();
    };

    canvas.addEventListener("pointerup", endDraw);
    canvas.addEventListener("pointercancel", endDraw);
    canvas.addEventListener("pointerleave", endDraw);
  }

  // ---------- Actions ----------
  function bindActions() {
    themeToggle?.addEventListener("click", toggleTheme);
    document.getElementById("clear").addEventListener("click", () => {
      clearCanvas();
      pushHistory();
    });

    bgUpload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleBackgroundUpload(file);
      e.target.value = ""; // Reset so same file can be picked again
    });

    clearBgBtn.addEventListener("click", () => {
      if (!backgroundDataURL) return;
      if (!confirm("Remove background image?")) return;
      removeBackground();
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

    // Wheel zoom on the background (only when move-bg is active)
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (selectedTool !== "move-bg" || !backgroundDataURL) return;
        e.preventDefault();
        zoomBg(e.deltaY > 0 ? 0.9 : 1.1);
      },
      { passive: false },
    );

    document.getElementById("save").addEventListener("click", () => {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exCtx = exportCanvas.getContext("2d");

      // 1) White base
      exCtx.fillStyle = "#ffffff";
      exCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 2) Draw the background image (if any) with transform
      if (backgroundDataURL) {
        const img = new Image();
        img.onload = () => {
          const dpr = exportCanvas.width / canvas.getBoundingClientRect().width;

          // Cover-fit base
          const baseScale = Math.max(
            exportCanvas.width / img.width,
            exportCanvas.height / img.height,
          );

          // Combine with user transform
          const totalScale = baseScale * bgTransform.scale;
          const dw = img.width * totalScale;
          const dh = img.height * totalScale;

          // Center + user offset
          const dx = (exportCanvas.width - dw) / 2 + bgTransform.x * dpr;
          const dy = (exportCanvas.height - dh) / 2 + bgTransform.y * dpr;

          exCtx.drawImage(img, dx, dy, dw, dh);

          // 3) Draw the drawing on top
          exCtx.drawImage(canvas, 0, 0);

          // 4) Download
          const link = document.createElement("a");
          link.download = `poyberpaint-${Date.now()}.png`;
          link.href = exportCanvas.toDataURL("image/png");
          link.click();
        };
        img.src = backgroundDataURL;
      } else {
        exCtx.drawImage(canvas, 0, 0);

        const link = document.createElement("a");
        link.download = `poyberpaint-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
      }
    });

    document.getElementById("reset").addEventListener("click", () => {
      if (
        !confirm("This will clear your saved drawing and settings. Continue?")
      )
        return;
      Storage.clearCanvas();
      Storage.saveSettings({});
      location.reload();
    });
  }

  // ---------- Keyboard ----------
  function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undoBtn.click();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        redoBtn.click();
      } else if (k === "s") {
        e.preventDefault();
        document.getElementById("save").click();
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

  // ---------- showSaved ----------
  function showSaved() {
    if (!saveIndicator) return;
    saveIndicator.style.opacity = "1";
    clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(() => {
      saveIndicator.style.opacity = "0";
    }, 1200);
  }

  // ---------- persistCanvas ----------
  function persistCanvas() {
    if (!Storage.available) return;
    Storage.saveCanvas(canvas.toDataURL("image/png"));
    showSaved();
  }

  // ---------- persistSettings ----------
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

  // ---------- Load Saved State ----------
  function loadSavedState() {
    const settings = Storage.loadSettings();
    if (settings?.theme) applyTheme(settings.theme);
    if (!settings) return;

    selectedTool = settings.tool || "brush";
    selectedColor = settings.color || "#000000";
    brushWidth = settings.width || 5;
    fillColor.checked = !!settings.fill;

    // Apply to UI
    sizeSlider.value = brushWidth;
    sizeLabel.textContent = brushWidth + "px";

    // Highlight active tool button
    document.querySelectorAll(".tool-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === selectedTool);
    });

    // Highlight active color swatch
    document.querySelectorAll(".swatch").forEach((s) => {
      s.classList.toggle("selected", s.dataset.color === selectedColor);
    });

    // 👇 Set cursor class if move-bg is the selected tool
    document.body.classList.toggle("tool-move-bg", selectedTool === "move-bg");
  }

  // ---------- Load Saved Canvas ----------
  function loadSavedCanvas() {
    const dataURL = Storage.loadCanvas();
    if (!dataURL) return Promise.resolve(false);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.save();
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        ctx.restore();
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = dataURL;
    });
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

    setupCanvas();

    // Load background image into DOM layer (not canvas)
    const bgData = Storage.loadBackground();
    if (bgData) {
      applyBackgroundToLayer(bgData);
      backgroundDataURL = bgData;
      clearBgBtn.classList.remove("hidden");
      bgControls.classList.remove("hidden");
      loadBgTransform();
    }

    await loadSavedCanvas();
    pushHistory();

    window.addEventListener("resize", debounce(setupCanvas, 200));
  }

  window.addEventListener("load", init);
})();
