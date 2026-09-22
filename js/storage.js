/**
 * PoyberPaint — Storage Module
 * Handles persistence of canvas and settings via localStorage.
 * @author AshkanPoyber
 */

const Storage = (() => {
  "use strict";

  const KEYS = {
    CANVAS: "poyberpaint:canvas",
    SETTINGS: "poyberpaint:settings",
    VERSION: "poyberpaint:version",
    BACKGROUND: "poyberpaint:background",
  };

  const CURRENT_VERSION = "1.0.0";

  // ---------- Availability check ----------
  function isAvailable() {
    try {
      const t = "__poyberpaint_test__";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return true;
    } catch {
      return false;
    }
  }

  const available = isAvailable();

  // ---------- Canvas ----------
  function saveCanvas(dataURL) {
    if (!available) return;
    try {
      localStorage.setItem(KEYS.CANVAS, dataURL);
      localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
    } catch (e) {
      // Probably quota exceeded — clear old data
      console.warn(
        "PoyberPaint: storage quota exceeded, clearing canvas data.",
      );
      localStorage.removeItem(KEYS.CANVAS);
    }
  }

  function loadCanvas() {
    if (!available) return null;
    return localStorage.getItem(KEYS.CANVAS);
  }

  function clearCanvas() {
    if (!available) return;
    localStorage.removeItem(KEYS.CANVAS);
  }

  // ---------- Settings ----------
  function saveSettings(settings) {
    if (!available) return;
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }

  function loadSettings() {
    if (!available) return null;
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ---------- Background ----------
  function saveBackground(dataURL) {
    if (!available) return false;
    try {
      localStorage.setItem(KEYS.BACKGROUND, dataURL);
      return true;
    } catch (e) {
      console.warn("PoyberPaint: background too large for storage.");
      return false;
    }
  }

  function loadBackground() {
    if (!available) return null;
    return localStorage.getItem(KEYS.BACKGROUND);
  }

  function clearBackground() {
    if (!available) return;
    localStorage.removeItem(KEYS.BACKGROUND);
  }

  // ---------- Public API ----------
  return {
    available,
    saveCanvas,
    loadCanvas,
    clearCanvas,
    saveSettings,
    loadSettings,
    saveBackground,
    loadBackground,
    clearBackground,
  };
})();
