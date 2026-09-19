/**
 * PoyberPaint — A modern paint & drawing web app.
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

  const history = [];
  const redoStack = [];

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
    });

    picker.addEventListener("input", () => {
      colorRow
        .querySelectorAll(".swatch")
        .forEach((s) => s.classList.remove("selected"));
      selectedColor = picker.value;
    });
  }

  // ---------- Tools ----------
  function bindTools() {
    toolBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        document.querySelector(".tool-btn.active")?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.dataset.tool;
      }),
    );

    sizeSlider.addEventListener("input", () => {
      brushWidth = +sizeSlider.value;
      sizeLabel.textContent = brushWidth + "px";
    });
  }

  // ---------- Canvas Setup ----------
  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();

    // Preserve previous drawing when resizing
    let prev = null;
    if (canvas.width && canvas.height) {
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

    // White background in CSS pixels
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

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
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  }

  // ---------- History ----------
  function pushHistory() {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > MAX_HISTORY) history.shift();
    redoStack.length = 0;
    updateHistoryButtons();
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

  // ---------- Pointer Events ----------
  function bindDrawing() {
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      const { x, y } = getPos(e);
      startX = x;
      startY = y;

      ctx.lineWidth = brushWidth;
      ctx.strokeStyle = selectedTool === "eraser" ? "#ffffff" : selectedColor;
      ctx.fillStyle = selectedColor;

      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    });

    canvas.addEventListener("pointermove", (e) => {
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
      }
    });

    const endDraw = () => {
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
    document.getElementById("clear").addEventListener("click", () => {
      clearCanvas();
      pushHistory();
    });

    document.getElementById("save").addEventListener("click", () => {
      // Ensure background is white before export
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exCtx = exportCanvas.getContext("2d");
      exCtx.fillStyle = "#ffffff";
      exCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      exCtx.drawImage(canvas, 0, 0);

      const link = document.createElement("a");
      link.download = `poyberpaint-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
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

  // ---------- Init ----------
  function init() {
    buildColorSwatches();
    bindTools();
    bindHistory();
    bindDrawing();
    bindActions();
    bindKeyboard();

    setupCanvas();
    pushHistory();

    window.addEventListener("resize", debounce(setupCanvas, 200));
  }

  window.addEventListener("load", init);
})();
