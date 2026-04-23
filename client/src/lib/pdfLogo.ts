/**
 * Loads the app logo, resizes it via a canvas, and returns a PNG data URL
 * small enough to embed in a jsPDF without bloating the output to tens of MB.
 *
 * The source logo is 4731x3240 (~61 MB uncompressed RGBA). jsPDF embeds
 * images at source resolution regardless of on-page size, so we downscale
 * to ~400px wide — more than enough for the 20x16mm header slot at 300dpi —
 * and cache the result.
 */

let cached: Promise<string> | null = null;

const LOGO_URL = "/logo-legendarios.png";
const TARGET_WIDTH = 400; // px — plenty for ~20mm display

export function getLogoDataUrl(): Promise<string> {
  if (cached) return cached;
  cached = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const ratio = img.height / img.width;
        const w = TARGET_WIDTH;
        const h = Math.round(TARGET_WIDTH * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas 2d context unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`failed to load ${LOGO_URL}`));
    img.src = LOGO_URL;
  });
  return cached;
}
