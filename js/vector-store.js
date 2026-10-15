/**
 * PoyberPaint — Vector Store Module
 * Tracks every drawing action as vector data (for SVG export).
 * Runs alongside the canvas — does not replace it.
 *
 * @author AshkanPoyber
 * @since v2.2.0
 */

const VectorStore = (() => {
  "use strict";

  /**
   * Action schema:
   *   { id, layerId, type, ...payload }
   *
   * Types:
   *   "brush"    → { points: [{x,y}], color, width, opacity }
   *   "eraser"   → { points: [{x,y}], width }
   *   "rect"     → { x, y, w, h, color, width, fill, filled }
   *   "circle"   → { cx, cy, r, color, width, fill, filled }
   *   "triangle" → { x1,y1, x2,y2, x3,y3, color, width, fill, filled }
   *   "line"     → { x1, y1, x2, y2, color, width }
   *   "arrow"    → { x1, y1, x2, y2, color, width }
   *   "text"     → { x, y, content, fontSize, color }
   *   "clear"    → {} — clears all actions of the layer
   *   "bg"       → { dataURL, transform } — background image snapshot
   *   "unsupported" → { kind } — flood fill etc. (not exported to SVG)
   */

  /** @type {Array<Object>} */
  let actions = [];

  /** @type {number} */
  let nextId = 1;

  /** @type {Set<string>} */
  const unsupportedLayers = new Set();

  // ─────────────────────────────────────────────
  //  Core API
  // ─────────────────────────────────────────────

  /**
   * Push a new vector action.
   * @param {Object} action
   */
  function push(action) {
    if (!action || typeof action !== "object") return;

    // Resolve layerId FIRST — action can override, but never with undefined
    const resolvedLayerId =
      action.layerId != null ? action.layerId : getCurrentLayerId();

    const entry = {
      ...action,
      id: nextId++,
      layerId: resolvedLayerId,
      timestamp: Date.now(),
    };

    // A "clear" wipes previous actions of that layer
    if (entry.type === "clear") {
      actions = actions.filter((a) => a.layerId !== entry.layerId);
      unsupportedLayers.delete(entry.layerId);
      return;
    }

    // Background replacement — keep only the latest bg per layer
    if (entry.type === "bg") {
      actions = actions.filter(
        (a) => !(a.layerId === entry.layerId && a.type === "bg"),
      );
    }

    // Mark layer as "has unsupported content" for flood fill
    if (entry.type === "unsupported") {
      unsupportedLayers.add(entry.layerId);
    }

    actions.push(entry);
  }

  /**
   * Remove the last action of a specific layer (for undo).
   * @param {string} layerId
   * @returns {Object|null} the removed action
   */
  function popLast(layerId) {
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i].layerId === layerId) {
        const [removed] = actions.splice(i, 1);
        return removed;
      }
    }
    return null;
  }

  /**
   * Restore a previously popped action (for redo).
   * @param {Object} action
   */
  function restore(action) {
    if (!action) return;
    actions.push(action);
    if (action.type === "unsupported") {
      unsupportedLayers.add(action.layerId);
    }
  }

  /**
   * Get all actions for a specific layer (in order).
   * @param {string} layerId
   * @returns {Array<Object>}
   */
  function getForLayer(layerId) {
    return actions.filter((a) => a.layerId === layerId);
  }

  /**
   * Get all actions, optionally filtered by visible layer ids.
   * @param {Set<string>|Array<string>} [visibleLayerIds]
   * @returns {Array<Object>}
   */
  function getAll(visibleLayerIds) {
    if (!visibleLayerIds) return [...actions];
    const allow =
      visibleLayerIds instanceof Set
        ? visibleLayerIds
        : new Set(visibleLayerIds);
    return actions.filter((a) => allow.has(a.layerId));
  }

  /**
   * Check if a layer has any unsupported (non-vector) content.
   * @param {string} layerId
   * @returns {boolean}
   */
  function hasUnsupported(layerId) {
    return unsupportedLayers.has(layerId);
  }

  /**
   * Clear everything (used on full reset).
   */
  function clearAll() {
    actions = [];
    unsupportedLayers.clear();
    nextId = 1;
  }

  /**
   * Remove every action belonging to a layer (used on layer delete).
   * @param {string} layerId
   */
  function dropLayer(layerId) {
    actions = actions.filter((a) => a.layerId !== layerId);
    unsupportedLayers.delete(layerId);
  }

  /**
   * Snapshot / restore the full state (used for layer duplication).
   * @returns {Object}
   */
  function snapshot() {
    return {
      actions: JSON.parse(JSON.stringify(actions)),
      unsupported: [...unsupportedLayers],
      nextId,
    };
  }

  /**
   * @param {Object} snap
   */
  function restoreSnapshot(snap) {
    if (!snap) return;
    actions = snap.actions || [];
    unsupportedLayers.clear();
    (snap.unsupported || []).forEach((id) => unsupportedLayers.add(id));
    nextId = snap.nextId || actions.length + 1;
  }

  // ─────────────────────────────────────────────
  //  Diagnostics
  // ─────────────────────────────────────────────

  function stats() {
    const byType = {};
    actions.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });
    return {
      total: actions.length,
      byType,
      layers: new Set(actions.map((a) => a.layerId)).size,
      unsupportedLayers: [...unsupportedLayers],
    };
  }

  // ─────────────────────────────────────────────
  //  Internal
  // ─────────────────────────────────────────────

  /**
   * Resolve current active layer id lazily (avoids circular dependency).
   * @returns {string|null}
   */
  function getCurrentLayerId() {
    try {
      if (typeof LayerStore !== "undefined" && LayerStore.activeLayerId) {
        return LayerStore.activeLayerId;
      }
    } catch {}
    return null;
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  return {
    push,
    popLast,
    restore,
    getForLayer,
    getAll,
    hasUnsupported,
    clearAll,
    dropLayer,
    snapshot,
    restoreSnapshot,
    stats,
  };
})();
