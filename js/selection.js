/**
 * PoyberPaint — Selection Module
 * Handles shape selection, hit-testing, and transforms.
 *
 * @author AshkanPoyber
 * @since v2.5.0
 */

const Selection = (() => {
  "use strict";

  // ─────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────

  let activeActionId = null; // id of the selected action in VectorStore
  let activeLayerId = null; // which layer the selected action belongs to
  let activeAction = null; // reference to the action object

  /**
   * @returns {{actionId: string|null, layerId: string|null, action: Object|null}}
   */
  function getState() {
    return {
      actionId: activeActionId,
      layerId: activeLayerId,
      action: activeAction,
    };
  }

  function hasSelection() {
    return activeAction !== null;
  }

  /**
   * Clear the current selection.
   */
  function clear() {
    activeActionId = null;
    activeLayerId = null;
    activeAction = null;
  }

  /**
   * Set the current selection.
   * @param {Object} action - the action object from VectorStore
   */
  function set(action) {
    if (!action) {
      clear();
      return;
    }
    activeActionId = action.id;
    activeLayerId = action.layerId;
    activeAction = action;
  }

  // ─────────────────────────────────────────────
  //  Hit testing
  // ─────────────────────────────────────────────

  /**
   * Check if a point (in canvas/world coords) is inside an action's bounds.
   * Returns true if the point should select this action.
   *
   * @param {Object} action
   * @param {number} x
   * @param {number} y
   * @param {number} tolerance - extra px around thin shapes (lines, arrows)
   * @returns {boolean}
   */
  function hitTest(action, x, y, tolerance = 8) {
    if (!action) return false;

    switch (action.type) {
      case "rect": {
        const { x: ax, y: ay, w, h } = action;
        return (
          x >= ax - tolerance &&
          x <= ax + w + tolerance &&
          y >= ay - tolerance &&
          y <= ay + h + tolerance
        );
      }

      case "circle": {
        const { cx, cy, r } = action;
        const dist = Math.hypot(x - cx, y - cy);
        return dist <= r + tolerance;
      }

      case "triangle": {
        return pointInTriangle(
          x,
          y,
          action.x1,
          action.y1,
          action.x2,
          action.y2,
          action.x3,
          action.y3,
        );
      }

      case "line": {
        return (
          pointToSegmentDistance(
            x,
            y,
            action.x1,
            action.y1,
            action.x2,
            action.y2,
          ) <= tolerance
        );
      }

      case "arrow": {
        return (
          pointToSegmentDistance(
            x,
            y,
            action.x1,
            action.y1,
            action.x2,
            action.y2,
          ) <=
          tolerance + 4
        );
      }

      case "text": {
        // Rough bounds: use fontSize and approximate character width
        const fontSize = action.fontSize || 14;
        const textWidth = (action.content || "").length * fontSize * 0.6;
        const x0 = action.x;
        const y0 = action.y - fontSize / 2;
        return (
          x >= x0 - tolerance &&
          x <= x0 + textWidth + tolerance &&
          y >= y0 - tolerance &&
          y <= y0 + fontSize + tolerance
        );
      }

      default:
        return false;
    }
  }

  /**
   * Find the top-most action at (x, y) among a list of actions.
   * Later actions are on top, so we iterate backwards.
   *
   * @param {Object[]} actions
   * @param {number} x
   * @param {number} y
   * @returns {Object|null}
   */
  function findActionAt(actions, x, y) {
    if (!Array.isArray(actions)) return null;
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      if (isSelectable(action) && hitTest(action, x, y)) {
        return action;
      }
    }
    return null;
  }

  /**
   * Is this action type selectable?
   * @param {Object} action
   * @returns {boolean}
   */
  function isSelectable(action) {
    if (!action) return false;
    const selectableTypes = [
      "rect",
      "circle",
      "triangle",
      "line",
      "arrow",
      "text",
    ];
    return selectableTypes.includes(action.type);
  }

  // ─────────────────────────────────────────────
  //  Geometry helpers
  // ─────────────────────────────────────────────

  /**
   * Distance from point (px, py) to segment (x1, y1)-(x2, y2).
   */
  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  /**
   * Is point (px, py) inside triangle (x1,y1)-(x2,y2)-(x3,y3)?
   */
  function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = sign(px, py, x1, y1, x2, y2);
    const d2 = sign(px, py, x2, y2, x3, y3);
    const d3 = sign(px, py, x3, y3, x1, y1);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
  }

  function sign(px, py, x1, y1, x2, y2) {
    return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  return {
    getState,
    hasSelection,
    set,
    clear,
    hitTest,
    findActionAt,
    isSelectable,
  };
})();
