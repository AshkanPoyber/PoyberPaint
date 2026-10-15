/**
 * PoyberPaint — SVG Export Module
 * Converts the VectorStore actions into a clean, scalable SVG.
 *
 * @author AshkanPoyber
 * @since v2.2.0
 */

const SvgExport = (() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const XLINK_NS = "http://www.w3.org/1999/xlink";

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  function el(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === "") continue;
      node.setAttribute(k, String(v));
    }
    children.forEach((c) => node.appendChild(c));
    return node;
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Build a smooth path d-string from points.
   * Uses simple line segments — matches the canvas look closely.
   * @param {Array<{x:number,y:number}>} points
   * @returns {string}
   */
  function pointsToPath(points) {
    if (!points || points.length === 0) return "";
    if (points.length === 1) {
      // dot
      const p = points[0];
      return `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  // ─────────────────────────────────────────────
  //  Action → SVG node
  // ─────────────────────────────────────────────

  /**
   * @param {Object} action
   * @param {string} [maskId] — when defined, output is for a mask
   * @returns {SVGElement|null}
   */
  function actionToNode(action, maskId) {
    const type = action.type;

    // ── Brush ──────────────────────────────────
    if (type === "brush") {
      const d = pointsToPath(action.points);
      if (!d) return null;
      return el("path", {
        d,
        fill: "none",
        stroke: action.color || "#000000",
        "stroke-width": action.width || 1,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
    }

    // ── Eraser (only meaningful inside a mask) ──
    if (type === "eraser") {
      if (!maskId) return null; // handled at mask level
      const d = pointsToPath(action.points);
      if (!d) return null;
      return el("path", {
        d,
        fill: "none",
        stroke: "#000000",
        "stroke-width": action.width || 1,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
    }

    // ── Rectangle ──────────────────────────────
    if (type === "rect") {
      return el("rect", {
        x: action.x,
        y: action.y,
        width: action.w,
        height: action.h,
        fill: action.filled ? action.color : "none",
        stroke: action.color,
        "stroke-width": action.width,
      });
    }

    // ── Circle ─────────────────────────────────
    if (type === "circle") {
      return el("circle", {
        cx: action.cx,
        cy: action.cy,
        r: action.r,
        fill: action.filled ? action.color : "none",
        stroke: action.color,
        "stroke-width": action.width,
      });
    }

    // ── Triangle ───────────────────────────────
    if (type === "triangle") {
      const pts = `${action.x1},${action.y1} ${action.x2},${action.y2} ${action.x3},${action.y3}`;
      return el("polygon", {
        points: pts,
        fill: action.filled ? action.color : "none",
        stroke: action.color,
        "stroke-width": action.width,
        "stroke-linejoin": "round",
      });
    }

    // ── Line ───────────────────────────────────
    if (type === "line") {
      return el("line", {
        x1: action.x1,
        y1: action.y1,
        x2: action.x2,
        y2: action.y2,
        stroke: action.color,
        "stroke-width": action.width,
        "stroke-linecap": "round",
      });
    }

    // ── Arrow ──────────────────────────────────
    if (type === "arrow") {
      const g = el("g", {});
      // shaft
      g.appendChild(
        el("line", {
          x1: action.x1,
          y1: action.y1,
          x2: action.x2,
          y2: action.y2,
          stroke: action.color,
          "stroke-width": action.width,
          "stroke-linecap": "round",
        }),
      );
      // head
      const headLength = Math.max(12, (action.width || 1) * 2.5);
      const angle = Math.atan2(action.y2 - action.y1, action.x2 - action.x1);
      const x1 = action.x2 - headLength * Math.cos(angle - Math.PI / 7);
      const y1 = action.y2 - headLength * Math.sin(angle - Math.PI / 7);
      const x2 = action.x2 - headLength * Math.cos(angle + Math.PI / 7);
      const y2 = action.y2 - headLength * Math.sin(angle + Math.PI / 7);
      g.appendChild(
        el("polyline", {
          points: `${x1},${y1} ${action.x2},${action.y2} ${x2},${y2}`,
          fill: "none",
          stroke: action.color,
          "stroke-width": action.width,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
      );
      return g;
    }

    // ── Text ───────────────────────────────────
    if (type === "text") {
      return el(
        "text",
        {
          x: action.x,
          y: action.y,
          fill: action.color || "#000000",
          "font-family":
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": action.fontSize || 14,
          "font-weight": 500,
          "dominant-baseline": "middle",
        },
        [document.createTextNode(action.content || "")],
      );
    }

    // ── Background image ───────────────────────
    if (type === "bg") {
      const t = action.transform || {};
      const W = action.canvasWidth;
      const H = action.canvasHeight;
      const iw = action.naturalWidth;
      const ih = action.naturalHeight;
      if (!W || !H || !iw || !ih) return null;

      const fitScale = Math.min(W / iw, H / ih);
      const dw = iw * fitScale * (t.scale || 1) * Math.abs(t.flipH || 1);
      const dh = ih * fitScale * (t.scale || 1) * Math.abs(t.flipV || 1);
      const cx = W / 2 + (t.x || 0);
      const cy = H / 2 + (t.y || 0);
      const rot = t.rotation || 0;

      const img = el("image", {
        href: action.dataURL,
        x: -dw / 2,
        y: -dh / 2,
        width: dw,
        height: dh,
        preserveAspectRatio: "none",
        transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${t.flipH || 1} ${t.flipV || 1})`,
      });
      img.setAttributeNS(XLINK_NS, "xlink:href", action.dataURL);
      return img;
    }

    // Everything else (e.g. "unsupported" flood fill) is skipped.
    return null;
  }

  // ─────────────────────────────────────────────
  //  Layer → SVG group (with optional mask)
  // ─────────────────────────────────────────────

  /**
   * @param {Object} layer — { id, name, opacity, visible }
   * @param {number} maskSeq — unique counter for mask ids
   * @returns {SVGElement|null}
   */
  function layerToGroup(layer, maskSeq) {
    const layerActions = VectorStore.getForLayer(layer.id);
    if (layerActions.length === 0) return null;

    const erasers = layerActions.filter((a) => a.type === "eraser");
    const drawable = layerActions.filter((a) => a.type !== "eraser");

    if (drawable.length === 0 && erasers.length === 0) return null;

    // Build mask (if any eraser)
    let maskId = null;
    let maskNode = null;

    if (erasers.length > 0) {
      maskId = `pp-eraser-${maskSeq}`;
      maskNode = el(
        "mask",
        {
          id: maskId,
          maskUnits: "userSpaceOnUse",
        },
        [
          // white = visible everywhere
          el("rect", {
            x: 0,
            y: 0,
            width: "100%",
            height: "100%",
            fill: "white",
          }),
          // black = erased paths
          ...erasers.map((a) => actionToNode(a, maskId)).filter(Boolean),
        ],
      );
    }

    // Build the content group
    const contentChildren = drawable
      .map((a) => actionToNode(a))
      .filter(Boolean);

    if (contentChildren.length === 0) return null;

    const group = el(
      "g",
      {
        opacity: layer.opacity != null ? layer.opacity : 1,
        "data-layer-name": layer.name || "",
        mask: maskId ? `url(#${maskId})` : undefined,
      },
      contentChildren,
    );

    // Attach mask inside the group's parent
    const wrapper = el("g", {});
    if (maskNode) wrapper.appendChild(maskNode);
    wrapper.appendChild(group);
    return wrapper;
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  /**
   * Build the full SVG element from the current app state.
   * @returns {{ svg: SVGElement, warnings: string[] }}
   */
  function build() {
    const warnings = [];

    const activeCanvas = (() => {
      try {
        return LayerStore.getActive()?.canvas || null;
      } catch {
        return null;
      }
    })();

    if (!activeCanvas) {
      return { svg: null, warnings: ["No active canvas"] };
    }

    const rect = activeCanvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    const svg = el("svg", {
      xmlns: SVG_NS,
      "xmlns:xlink": XLINK_NS,
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
    });

    // ── Background image (if any) ──
    const bgActions = VectorStore.getAll().filter((a) => a.type === "bg");
    if (bgActions.length > 0) {
      const latestBg = bgActions[bgActions.length - 1];
      const bgNode = actionToNode({
        ...latestBg,
        canvasWidth: W,
        canvasHeight: H,
      });
      if (bgNode) svg.appendChild(bgNode);
    }

    // ── Layer groups (in LayerStore order, bottom → top) ──
    let maskSeq = 1;
    let exportedLayers = 0;

    LayerStore.layers.forEach((layer) => {
      if (!layer.visible) return;

      if (VectorStore.hasUnsupported(layer.id)) {
        warnings.push(
          `"${layer.name}" contains flood-fill content which isn't exported to SVG.`,
        );
      }

      const group = layerToGroup(layer, maskSeq++);
      if (group) {
        svg.appendChild(group);
        exportedLayers++;
      }
    });

    if (exportedLayers === 0 && bgActions.length === 0) {
      return {
        svg: null,
        warnings: ["Nothing to export — draw something first!"],
      };
    }

    return { svg, warnings };
  }

  /**
   * Serialize an SVG element to a pretty-ish string.
   * @param {SVGElement} svg
   * @returns {string}
   */
  function serialize(svg) {
    const raw = new XMLSerializer().serializeToString(svg);
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    // Ensure xmlns on root (serializer sometimes drops it for XMLSerializer)
    const withNs = raw.includes("xmlns=")
      ? raw
      : raw.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    return header + withNs;
  }

  /**
   * High-level: build + serialize + return { text, warnings }.
   * @returns {{ text: string|null, warnings: string[] }}
   */
  function exportString() {
    const { svg, warnings } = build();
    if (!svg) return { text: null, warnings };
    return { text: serialize(svg), warnings };
  }

  return {
    build,
    serialize,
    exportString,
  };
})();
