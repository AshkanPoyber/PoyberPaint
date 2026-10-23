/**
 * PoyberPaint — Metadata Module
 * Embeds PoyberPaint info into exported PNG (tEXt chunks)
 * and SVG (<metadata> element) files.
 *
 * @author AshkanPoyber
 * @since v2.4.0
 */

const Metadata = (() => {
  "use strict";

  const APP_NAME = "PoyberPaint";
  const APP_VERSION = "2.4.0";
  const APP_URL = "https://ashkanpoyber.github.io/PoyberPaint/";
  const APP_AUTHOR = "MohammadReza Dalili (AshkanPoyber)";

  /**
   * Build the metadata key/value pairs to embed.
   * @returns {Object<string, string>}
   */
  function buildFields() {
    return {
      Software: `${APP_NAME} v${APP_VERSION}`,
      Author: APP_AUTHOR,
      Website: APP_URL,
      Created: new Date().toISOString(),
      Generator: `${APP_NAME} (vanilla JS + Canvas API)`,
    };
  }

  // ─────────────────────────────────────────────
  //  PNG
  // ─────────────────────────────────────────────

  /**
   * Add tEXt chunks to a PNG Blob.
   * The PNG signature (8 bytes) and IHDR (25 bytes) are preserved
   * untouched; all tEXt chunks are inserted right after IHDR.
   *
   * @param {Blob} pngBlob
   * @param {Object<string, string>} fields
   * @returns {Promise<Blob>}
   */
  async function embedInPng(pngBlob, fields) {
    const arrayBuffer = await pngBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (bytes.length < 33) {
      // Too small to be a valid PNG — return as-is
      return pngBlob;
    }

    const signature = bytes.slice(0, 8);
    const ihdr = bytes.slice(8, 33);
    const rest = bytes.slice(33);

    const textChunks = [];
    for (const [key, value] of Object.entries(fields)) {
      textChunks.push(buildTextChunk(key, value));
    }

    const total =
      signature.length +
      ihdr.length +
      textChunks.reduce((s, c) => s + c.length, 0) +
      rest.length;

    const out = new Uint8Array(total);
    let offset = 0;
    out.set(signature, offset);
    offset += signature.length;
    out.set(ihdr, offset);
    offset += ihdr.length;
    for (const chunk of textChunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    out.set(rest, offset);

    return new Blob([out], { type: "image/png" });
  }

  /**
   * Build a single PNG tEXt chunk.
   * Format: [length(4)] [type(4)] [keyword\0text] [crc(4)]
   *
   * @param {string} keyword
   * @param {string} text
   * @returns {Uint8Array}
   */
  function buildTextChunk(keyword, text) {
    // tEXt is Latin-1 — strip anything outside printable ASCII
    const safeKey = String(keyword).replace(/[^\x20-\x7E]/g, "");
    const safeText = String(text).replace(/[^\x20-\x7E\n\r\t]/g, "");

    const data = new TextEncoder().encode(`${safeKey}\0${safeText}`);
    const type = new TextEncoder().encode("tEXt");

    const len = data.length;
    const buf = new Uint8Array(4 + 4 + len + 4);
    const view = new DataView(buf.buffer);

    view.setUint32(0, len);
    buf.set(type, 4);
    buf.set(data, 8);

    const crcInput = new Uint8Array(4 + len);
    crcInput.set(type, 0);
    crcInput.set(data, 4);
    view.setUint32(8 + len, crc32(crcInput) >>> 0);

    return buf;
  }

  /**
   * CRC-32 (standard PNG polynomial: 0xEDB88320).
   * @param {Uint8Array} bytes
   * @returns {number}
   */
  let _crcTable = null;
  function crc32(bytes) {
    if (!_crcTable) {
      _crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        _crcTable[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = _crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // ─────────────────────────────────────────────
  //  SVG
  // ─────────────────────────────────────────────

  /**
   * Inject (or refresh) a <metadata> element in an SVG.
   * @param {SVGElement} svg
   */
  function injectIntoSvg(svg) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    // Remove any existing metadata (idempotent)
    svg
      .querySelectorAll("metadata[data-poyberpaint]")
      .forEach((n) => n.remove());

    const meta = document.createElementNS(SVG_NS, "metadata");
    meta.setAttribute("data-poyberpaint", "true");
    meta.textContent = [
      `Created with ${APP_NAME} v${APP_VERSION}`,
      `Author: ${APP_AUTHOR}`,
      `Website: ${APP_URL}`,
      `Date: ${new Date().toISOString()}`,
    ].join("\n");

    svg.insertBefore(meta, svg.firstChild);
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  return {
    APP_NAME,
    APP_VERSION,
    APP_URL,
    APP_AUTHOR,
    buildFields,
    embedInPng,
    injectIntoSvg,
  };
})();
