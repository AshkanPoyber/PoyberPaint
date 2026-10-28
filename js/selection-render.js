/**
 * PoyberPaint — Selection Render Module
 * Draws the visual selection overlay (outline + handles) on top of the canvas.
 *
 * @author AshkanPoyber
 * @since v2.5.0
 */

const SelectionRender = (() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const HANDLE_R = 5; // handle radius in world pixels
  const OUTLINE_COLOR = "#6366f1";
  const OUTLINE_WIDTH = 1.5;

  let overlayEl = null;
  let selectionGroup = null;

  /**
   * Initialize the overlay with a reference to the SVG element.
   * @param {SVGElement} svg
   */
  function init(svg) {
    if (!svg) return;
    overlayEl = svg;
    overlayEl.innerHTML = "";

    // A single <g> that we update on every selection change
    selectionGroup = document.createElementNS(SVG_NS, "g");
    selectionGroup.setAttribute("data-role", "selection");
    overlayEl.appendChild(selectionGroup);
  }

  /**
   * Compute the bounding box of an action.
   * @param {Object} action
   * @returns {{x:number, y:number, w:number, h:number, cx:number, cy:number}|null}
   */
  function getBBox(action) {
    if (!action) return null;

    switch (action.type) {
      case "rect":
        return {
          x: action.x,
          y: action.y,
          w: action.w,
          h: action.h,
          cx: action.x + action.w / 2,
          cy: action.y + action.h / 2,
        };

      case "circle":
        return {
          x: action.cx - action.r,
          y: action.cy - action.r,
          w: action.r * 2,
          h: action.r * 2,
          cx: action.cx,
          cy: action.cy,
        };

      case "triangle": {
        const minX = Math.min(action.x1, action.x2, action.x3);
        const maxX = Math.max(action.x1, action.x2, action.x3);
        const minY = Math.min(action.y1, action.y2, action.y3);
        const maxY = Math.max(action.y1, action.y2, action.y3);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
        };
      }

      case "line":
      case "arrow": {
        const minX = Math.min(action.x1, action.x2);
        const maxX = Math.max(action.x1, action.x2);
        const minY = Math.min(action.y1, action.y2);
        const maxY = Math.max(action.y1, action.y2);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
        };
      }

      case "text": {
        const fontSize = action.fontSize || 14;
        const approxWidth = (action.content || "").length * fontSize * 0.6;
        return {
          x: action.x,
          y: action.y - fontSize / 2,
          w: approxWidth,
          h: fontSize,
          cx: action.x + approxWidth / 2,
          cy: action.y,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Draw the selection overlay for the given action.
   * Pass `null` to clear.
   *
   * @param {Object|null} action
   */
  function draw(action) {
    if (!selectionGroup) return;
    selectionGroup.innerHTML = "";

    if (!action) return;

    const bbox = getBBox(action);
    if (!bbox) return;

    // ── Outline (dashed blue rect) ─────────────
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", bbox.x);
    rect.setAttribute("y", bbox.y);
    rect.setAttribute("width", bbox.w);
    rect.setAttribute("height", bbox.h);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", OUTLINE_COLOR);
    rect.setAttribute("stroke-width", OUTLINE_WIDTH);
    rect.setAttribute("stroke-dasharray", "4 3");
    rect.setAttribute("pointer-events", "none");
    rect.setAttribute("vector-effect", "non-scaling-stroke");
    selectionGroup.appendChild(rect);

    // ── Resize handles (8 total) ───────────────
    const handles = [
      { x: bbox.x, y: bbox.y, cursor: "nwse-resize", role: "tl" },
      { x: bbox.x + bbox.w / 2, y: bbox.y, cursor: "ns-resize", role: "tm" },
      { x: bbox.x + bbox.w, y: bbox.y, cursor: "nesw-resize", role: "tr" },
      {
        x: bbox.x + bbox.w,
        y: bbox.y + bbox.h / 2,
        cursor: "ew-resize",
        role: "rm",
      },
      {
        x: bbox.x + bbox.w,
        y: bbox.y + bbox.h,
        cursor: "nwse-resize",
        role: "br",
      },
      {
        x: bbox.x + bbox.w / 2,
        y: bbox.y + bbox.h,
        cursor: "ns-resize",
        role: "bm",
      },
      { x: bbox.x, y: bbox.y + bbox.h, cursor: "nesw-resize", role: "bl" },
      { x: bbox.x, y: bbox.y + bbox.h / 2, cursor: "ew-resize", role: "lm" },
    ];

    handles.forEach((h) => {
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", h.x);
      circle.setAttribute("cy", h.y);
      circle.setAttribute("r", HANDLE_R);
      circle.setAttribute("fill", "#ffffff");
      circle.setAttribute("stroke", OUTLINE_COLOR);
      circle.setAttribute("stroke-width", 1.5);
      circle.setAttribute("data-handle", h.role);
      circle.setAttribute("data-cursor", h.cursor);
      circle.setAttribute("pointer-events", "auto");
      circle.style.cursor = h.cursor;
      circle.setAttribute("vector-effect", "non-scaling-stroke");
      selectionGroup.appendChild(circle);
    });

    // ── Rotate handle (top, connected by a line) ──
    const rotateOffset = 24; // distance above top edge
    const rotateX = bbox.x + bbox.w / 2;
    const rotateY = bbox.y - rotateOffset;

    const rotateLine = document.createElementNS(SVG_NS, "line");
    rotateLine.setAttribute("x1", bbox.x + bbox.w / 2);
    rotateLine.setAttribute("y1", bbox.y);
    rotateLine.setAttribute("x2", rotateX);
    rotateLine.setAttribute("y2", rotateY);
    rotateLine.setAttribute("stroke", OUTLINE_COLOR);
    rotateLine.setAttribute("stroke-width", OUTLINE_WIDTH);
    rotateLine.setAttribute("pointer-events", "none");
    rotateLine.setAttribute("vector-effect", "non-scaling-stroke");
    selectionGroup.appendChild(rotateLine);

    const rotateCircle = document.createElementNS(SVG_NS, "circle");
    rotateCircle.setAttribute("cx", rotateX);
    rotateCircle.setAttribute("cy", rotateY);
    rotateCircle.setAttribute("r", HANDLE_R);
    rotateCircle.setAttribute("fill", "#8b5cf6");
    rotateCircle.setAttribute("stroke", "#ffffff");
    rotateCircle.setAttribute("stroke-width", 1.5);
    rotateCircle.setAttribute("data-handle", "rotate");
    rotateCircle.setAttribute("data-cursor", "grab");
    rotateCircle.setAttribute("pointer-events", "auto");
    rotateCircle.style.cursor = "grab";
    rotateCircle.setAttribute("vector-effect", "non-scaling-stroke");
    selectionGroup.appendChild(rotateCircle);
  }

  /**
   * Clear the overlay.
   */
  function clear() {
    if (!selectionGroup) return;
    selectionGroup.innerHTML = "";
  }

  /**
   * Refresh the overlay from the current Selection state.
   */
  function refresh() {
    if (typeof Selection === "undefined") return;
    const { action } = Selection.getState();
    draw(action);
  }

  return {
    init,
    draw,
    clear,
    refresh,
    getBBox,
  };
})();
