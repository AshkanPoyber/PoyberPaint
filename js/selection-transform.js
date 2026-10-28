/**
 * PoyberPaint — Selection Transform Module
 * Handles moving, resizing, and rotating selected shapes.
 *
 * @author AshkanPoyber
 * @since v2.5.0
 */

const SelectionTransform = (() => {
  "use strict";

  // ─────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────

  let mode = null; // "move" | "resize" | "rotate" | null
  let startPointer = { x: 0, y: 0 };
  let startAction = null; // deep clone of the action at drag start
  let activeHandle = null; // "tl" | "tr" | "bl" | "br" | "tm" | "bm" | "lm" | "rm"
  let moved = false;
  let aspectLocked = false;

  const MIN_SIZE = 4; // prevent degenerate shapes

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  function clone(action) {
    return JSON.parse(JSON.stringify(action));
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ─────────────────────────────────────────────
  //  MOVE
  // ─────────────────────────────────────────────

  function startMove(action, pos) {
    mode = "move";
    startPointer = { x: pos.x, y: pos.y };
    startAction = clone(action);
    moved = false;
  }

  function applyMove(action, pos) {
    if (mode !== "move" || !startAction) return false;

    const dx = pos.x - startPointer.x;
    const dy = pos.y - startPointer.y;

    if (dx === 0 && dy === 0) return false;
    moved = true;

    switch (action.type) {
      case "rect":
        action.x = startAction.x + dx;
        action.y = startAction.y + dy;
        break;

      case "circle":
        action.cx = startAction.cx + dx;
        action.cy = startAction.cy + dy;
        break;

      case "triangle":
        action.x1 = startAction.x1 + dx;
        action.y1 = startAction.y1 + dy;
        action.x2 = startAction.x2 + dx;
        action.y2 = startAction.y2 + dy;
        action.x3 = startAction.x3 + dx;
        action.y3 = startAction.y3 + dy;
        break;

      case "line":
      case "arrow":
        action.x1 = startAction.x1 + dx;
        action.y1 = startAction.y1 + dy;
        action.x2 = startAction.x2 + dx;
        action.y2 = startAction.y2 + dy;
        break;

      case "text":
        action.x = startAction.x + dx;
        action.y = startAction.y + dy;
        break;

      default:
        return false;
    }

    return true;
  }

  // ─────────────────────────────────────────────
  //  RESIZE
  // ─────────────────────────────────────────────

  /**
   * Start a resize operation.
   * @param {Object} action
   * @param {{x:number,y:number}} pos
   * @param {string} handle - "tl" | "tr" | "bl" | "br" | "tm" | "bm" | "lm" | "rm"
   * @param {boolean} shift - whether Shift is held (aspect lock)
   */
  function startResize(action, pos, handle, shift) {
    mode = "resize";
    startPointer = { x: pos.x, y: pos.y };
    startAction = clone(action);
    activeHandle = handle;
    aspectLocked = !!shift;
    moved = false;
  }

  /**
   * Apply a resize delta to an action.
   * Uses "scale from opposite corner" semantics.
   *
   * @param {Object} action
   * @param {{x:number,y:number}} pos
   * @param {boolean} shift
   * @returns {boolean}
   */
  function applyResize(action, pos, shift) {
    if (mode !== "resize" || !startAction || !activeHandle) return false;

    const dx = pos.x - startPointer.x;
    const dy = pos.y - startPointer.y;
    aspectLocked = !!shift;

    if (dx === 0 && dy === 0) return false;
    moved = true;

    switch (action.type) {
      case "rect":
        resizeRect(action, dx, dy);
        break;
      case "circle":
        resizeCircle(action, dx, dy);
        break;
      case "triangle":
        resizeTriangle(action, dx, dy);
        break;
      case "text":
        resizeText(action, dx, dy);
        break;
      default:
        return false;
    }

    return true;
  }

  function resizeRect(action, dx, dy) {
    const s = startAction;
    let { x, y, w, h } = s;

    const handle = activeHandle;

    // Horizontal
    if (handle === "tl" || handle === "bl" || handle === "lm") {
      const newX = x + dx;
      const newW = w - dx;
      if (newW >= MIN_SIZE) {
        action.x = newX;
        action.w = newW;
      }
    } else if (handle === "tr" || handle === "br" || handle === "rm") {
      const newW = w + dx;
      if (newW >= MIN_SIZE) {
        action.w = newW;
      }
    }

    // Vertical
    if (handle === "tl" || handle === "tr" || handle === "tm") {
      const newY = y + dy;
      const newH = h - dy;
      if (newH >= MIN_SIZE) {
        action.y = newY;
        action.h = newH;
      }
    } else if (handle === "bl" || handle === "br" || handle === "bm") {
      const newH = h + dy;
      if (newH >= MIN_SIZE) {
        action.h = newH;
      }
    }

    // Aspect lock (only for corner handles)
    if (
      aspectLocked &&
      (handle === "tl" || handle === "tr" || handle === "bl" || handle === "br")
    ) {
      const aspect = s.w / s.h;
      if (action.w != null) {
        action.h = action.w / aspect;
        if (handle === "tl" || handle === "tr") {
          action.y = s.y + (s.h - action.h);
        }
      }
    }

    // Normalize negative sizes
    if (action.w < 0) {
      action.x += action.w;
      action.w = Math.abs(action.w);
    }
    if (action.h < 0) {
      action.y += action.h;
      action.h = Math.abs(action.h);
    }
  }

  function resizeCircle(action, dx, dy) {
    const s = startAction;
    const handle = activeHandle;

    // Compute new radius based on the dominant axis of the drag
    let deltaR = 0;

    if (handle === "br" || handle === "rm" || handle === "bm") {
      deltaR = Math.max(dx, dy);
    } else if (handle === "tl" || handle === "lm" || handle === "tm") {
      deltaR = -Math.max(dx, dy);
    } else if (handle === "tr") {
      deltaR = Math.max(dx, -dy);
    } else if (handle === "bl") {
      deltaR = Math.max(-dx, dy);
    }

    const newR = Math.max(MIN_SIZE / 2, s.r + deltaR / 2);

    // Keep the circle's center anchored based on which handle
    let newCx = s.cx;
    let newCy = s.cy;

    if (handle === "tl" || handle === "lm" || handle === "bl") {
      newCx = s.cx + (s.r - newR);
    }
    if (handle === "tr" || handle === "rm" || handle === "br") {
      newCx = s.cx - (s.r - newR);
    }
    if (handle === "tl" || handle === "tm" || handle === "tr") {
      newCy = s.cy + (s.r - newR);
    }
    if (handle === "bl" || handle === "bm" || handle === "br") {
      newCy = s.cy - (s.r - newR);
    }

    action.r = newR;
    action.cx = newCx;
    action.cy = newCy;
  }

  function resizeTriangle(action, dx, dy) {
    // Simple approach: scale the triangle uniformly around its centroid.
    const s = startAction;
    const cx = (s.x1 + s.x2 + s.x3) / 3;
    const cy = (s.y1 + s.y2 + s.y3) / 3;

    const handle = activeHandle;
    let sx = 1;
    let sy = 1;

    if (handle === "lm" || handle === "bl" || handle === "tl") {
      sx = (cx - startPointer.x + dx) / (cx - startPointer.x || 1);
      sx = 1 + dx / Math.max(1, Math.abs(cx - startPointer.x));
    }
    if (handle === "rm" || handle === "br" || handle === "tr") {
      sx = 1 + dx / Math.max(1, Math.abs(cx - startPointer.x));
    }
    if (handle === "tm" || handle === "tl" || handle === "tr") {
      sy = 1 + dy / Math.max(1, Math.abs(cy - startPointer.y));
    }
    if (handle === "bm" || handle === "bl" || handle === "br") {
      sy = 1 + dy / Math.max(1, Math.abs(cy - startPointer.y));
    }

    sx = Math.max(0.1, sx);
    sy = Math.max(0.1, sy);

    if (aspectLocked) {
      const s2 = (sx + sy) / 2;
      sx = s2;
      sy = s2;
    }

    action.x1 = cx + (s.x1 - cx) * sx;
    action.y1 = cy + (s.y1 - cy) * sy;
    action.x2 = cx + (s.x2 - cx) * sx;
    action.y2 = cy + (s.y2 - cy) * sy;
    action.x3 = cx + (s.x3 - cx) * sx;
    action.y3 = cy + (s.y3 - cy) * sy;
  }

  function resizeText(action, dx, dy) {
    const s = startAction;
    const handle = activeHandle;

    let deltaSize = 0;
    if (handle === "br" || handle === "rm" || handle === "bm") {
      deltaSize = Math.max(dx, dy) / 4;
    } else if (handle === "tl" || handle === "lm" || handle === "tm") {
      deltaSize = -Math.max(dx, dy) / 4;
    }

    action.fontSize = Math.max(8, s.fontSize + deltaSize);
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  function isActive() {
    return mode !== null;
  }

  function getMode() {
    return mode;
  }

  function getActiveHandle() {
    return activeHandle;
  }

  function didMove() {
    return moved;
  }

  function cancel() {
    mode = null;
    activeHandle = null;
    startAction = null;
    moved = false;
  }

  function finish() {
    mode = null;
    activeHandle = null;
    startAction = null;
  }

  return {
    // move
    startMove,
    applyMove,
    // resize
    startResize,
    applyResize,
    // helpers
    isActive,
    getMode,
    getActiveHandle,
    didMove,
    cancel,
    finish,
    clone,
  };
})();
