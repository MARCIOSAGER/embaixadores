import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Ruler, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type SizeRow = { tamanho: number; circunferencia: number; usa: string };

const RING_SIZES: SizeRow[] = [
  { tamanho: 10, circunferencia: 5.00, usa: "5 3/8" },
  { tamanho: 11, circunferencia: 5.10, usa: "5 3/4" },
  { tamanho: 12, circunferencia: 5.20, usa: "6 1/4" },
  { tamanho: 13, circunferencia: 5.30, usa: "6 1/2" },
  { tamanho: 14, circunferencia: 5.40, usa: "7" },
  { tamanho: 15, circunferencia: 5.50, usa: "7 1/2" },
  { tamanho: 16, circunferencia: 5.60, usa: "7 3/4" },
  { tamanho: 17, circunferencia: 5.70, usa: "8 1/4" },
  { tamanho: 18, circunferencia: 5.80, usa: "8 1/2" },
  { tamanho: 19, circunferencia: 5.90, usa: "8 7/8" },
  { tamanho: 20, circunferencia: 6.00, usa: "9 3/8" },
  { tamanho: 21, circunferencia: 6.10, usa: "9 3/4" },
  { tamanho: 22, circunferencia: 6.20, usa: "10 1/4" },
  { tamanho: 23, circunferencia: 6.30, usa: "10 5/8" },
  { tamanho: 24, circunferencia: 6.40, usa: "11" },
  { tamanho: 25, circunferencia: 6.50, usa: "11 3/8" },
  { tamanho: 26, circunferencia: 6.60, usa: "11 3/4" },
  { tamanho: 27, circunferencia: 6.70, usa: "12" },
  { tamanho: 28, circunferencia: 6.80, usa: "12 1/2" },
  { tamanho: 29, circunferencia: 6.90, usa: "13" },
];

const fmt = (n: number) => n.toFixed(2).replace(".", ",");

/**
 * Visual grid of ring circles scaled proportionally to real diameter
 * (diameter = circumference / π).
 *
 * On screen: circles rendered with SVG at consistent scale so bigger sizes
 * look bigger. On print: CSS switches to actual-size `cm` units so the
 * user can place an existing ring over the circle to check its size.
 */
function RingCirclesChart() {
  const COLS = 5;
  const CELL = 92; // px
  const SCALE = 28; // px per cm — visual scale for on-screen
  const rows = Math.ceil(RING_SIZES.length / COLS);
  const svgWidth = COLS * CELL;
  const svgHeight = rows * CELL;

  return (
    <div className="ring-guide-chart rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        {RING_SIZES.map((row, i) => {
          const col = i % COLS;
          const rowIdx = Math.floor(i / COLS);
          const cx = col * CELL + CELL / 2;
          const cy = rowIdx * CELL + CELL / 2 + 4;
          const diameterCm = row.circunferencia / Math.PI;
          const r = (diameterCm * SCALE) / 2;
          return (
            <g key={row.tamanho}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="rgba(255,107,0,0.06)"
                stroke="#FF6B00"
                strokeWidth={1.2}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="#FFFFFF"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {row.tamanho}
              </text>
              <text
                x={cx}
                y={rowIdx * CELL + CELL - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#86868b"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {fmt(row.circunferencia)} cm
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function buildPrintableBody(title: string): string {
  const COLS = 5;
  const cells = RING_SIZES.map(row => {
    const diameterCm = row.circunferencia / Math.PI;
    return `
      <div class="rgp-cell">
        <div class="rgp-ring" style="width:${diameterCm.toFixed(3)}cm;height:${diameterCm.toFixed(3)}cm;">
          <span>${row.tamanho}</span>
        </div>
        <div class="rgp-lbl">${fmt(row.circunferencia)} cm</div>
      </div>`;
  }).join("");

  // Split table in two halves for side-by-side compact layout
  const half = Math.ceil(RING_SIZES.length / 2);
  const tableHalf = (rows: SizeRow[]) => `
    <table class="rgp-table">
      <thead><tr><th>BR</th><th>Circ.</th><th>US</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r.tamanho}</td><td>${fmt(r.circunferencia)} cm</td><td>${r.usa}</td></tr>`).join("")}
      </tbody>
    </table>
  `;

  return `
    <div class="rgp-header">
      <h1 class="rgp-h1">${title}</h1>
      <div class="rgp-calib">
        <span class="rgp-calib-label">Régua de calibração:</span>
        <span class="rgp-calib-bar"></span>
        <span class="rgp-calib-text">deve medir <b>1 cm</b> com uma régua. Se não medir, imprima em escala <b>100%</b> (sem "ajustar à página").</span>
      </div>
    </div>
    <p class="rgp-intro">
      <b>Como medir:</b> 1) Enrole uma linha fina ao redor do dedo (sem apertar).
      2) Marque onde se encontra. 3) Meça o comprimento com régua — esse é o valor em cm.
      Você também pode colocar um anel sobre o círculo correspondente abaixo.
    </p>
    <div class="rgp-grid" style="grid-template-columns: repeat(${COLS}, 1fr);">${cells}</div>
    <div class="rgp-tables">
      ${tableHalf(RING_SIZES.slice(0, half))}
      ${tableHalf(RING_SIZES.slice(half))}
    </div>
  `;
}

const PRINT_HOST_ID = "ring-guide-print-host";
const PRINT_STYLE_ID = "ring-guide-print-style";

function openPrintWindow(title: string) {
  // Avoid duplicates if user clicks repeatedly
  document.getElementById(PRINT_HOST_ID)?.remove();
  document.getElementById(PRINT_STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    #${PRINT_HOST_ID} { display: none; }
    @media print {
      @page { size: A4; margin: 10mm; }
      html, body { background: #fff !important; }
      body > *:not(#${PRINT_HOST_ID}) { display: none !important; }
      #${PRINT_HOST_ID} {
        display: block !important;
        position: static !important;
        background: #fff !important;
        color: #111 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        font-size: 9pt;
        line-height: 1.25;
      }
      #${PRINT_HOST_ID} * { color: #111 !important; }
      #${PRINT_HOST_ID} .rgp-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0 0 4px; }
      #${PRINT_HOST_ID} .rgp-h1 { font-size: 14pt; margin: 0; }
      #${PRINT_HOST_ID} .rgp-calib { display: inline-flex; align-items: center; gap: 4px; font-size: 7.5pt; color: #555 !important; }
      #${PRINT_HOST_ID} .rgp-calib-bar { display: inline-block; width: 1cm; height: 8pt; border: 0.6pt solid #111; border-top: 0; border-bottom: 0; position: relative; }
      #${PRINT_HOST_ID} .rgp-calib-bar::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 0; border-top: 0.6pt solid #111; }
      #${PRINT_HOST_ID} .rgp-calib-text { color: #555 !important; }
      #${PRINT_HOST_ID} .rgp-intro { font-size: 8.5pt; color: #444 !important; margin: 0 0 8px; line-height: 1.35; }
      #${PRINT_HOST_ID} .rgp-grid { display: grid; gap: 6px 8px; margin: 0 0 8px; }
      #${PRINT_HOST_ID} .rgp-cell { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
      #${PRINT_HOST_ID} .rgp-ring { border: 1pt solid #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      #${PRINT_HOST_ID} .rgp-ring span { font-weight: 700; font-size: 8.5pt; }
      #${PRINT_HOST_ID} .rgp-lbl { font-size: 7pt; color: #444 !important; margin-top: 2px; }
      #${PRINT_HOST_ID} .rgp-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      #${PRINT_HOST_ID} .rgp-table { border-collapse: collapse; width: 100%; font-size: 8pt; }
      #${PRINT_HOST_ID} .rgp-table th,
      #${PRINT_HOST_ID} .rgp-table td { border: 0.4pt solid #999; padding: 1.5pt 4pt; }
      #${PRINT_HOST_ID} .rgp-table th { background: #f1f1f1 !important; text-align: left; font-weight: 600; }
    }
  `;
  document.head.appendChild(style);

  const host = document.createElement("div");
  host.id = PRINT_HOST_ID;
  host.innerHTML = buildPrintableBody(title);
  document.body.appendChild(host);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    host.remove();
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  // Give the browser a tick to apply styles, then print
  setTimeout(() => {
    try { window.print(); } catch { cleanup(); return; }
    // Fallback cleanup if afterprint never fires
    setTimeout(cleanup, 60_000);
  }, 50);
}

export function RingSizeGuideButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const btnClass = variant === "light"
    ? "inline-flex items-center gap-1.5 text-[0.8125rem] text-[#FF6B00] hover:text-[#FF8533] transition-colors"
    : "inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#FF6B00] transition-colors";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t("ringGuide.verGuia")}
      </button>

      {open && createPortal(
        <div
          className="ring-guide-modal fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          style={{ zIndex: 2147483000, pointerEvents: "auto" }}
          onClick={() => setOpen(false)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={t("ringGuide.titulo")}
        >
          <div
            className="w-full sm:max-w-lg bg-[#1c1c1e] border border-white/[0.08] rounded-t-[20px] sm:rounded-[20px] max-h-[90vh] overflow-y-auto"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#1c1c1e] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-[0.9375rem] font-semibold text-white">{t("ringGuide.titulo")}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openPrintWindow(t("ringGuide.titulo")); }}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
                  aria-label={t("ringGuide.imprimir")}
                  title={t("ringGuide.imprimir")}
                >
                  <Printer className="w-4 h-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#FF6B00]/[0.08] border border-[#FF6B00]/20 rounded-xl p-4">
                <p className="text-[0.8125rem] text-[#d2d2d7] leading-relaxed">
                  <span className="font-semibold text-[#FF6B00]">{t("ringGuide.como.titulo")}</span>
                  <br />
                  {t("ringGuide.como.passo1")}
                  <br />
                  {t("ringGuide.como.passo2")}
                  <br />
                  {t("ringGuide.como.passo3")}
                </p>
              </div>

              <div>
                <p className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider mb-2">
                  {t("ringGuide.visual.titulo")}
                </p>
                <RingCirclesChart />
                <p className="text-[0.6875rem] text-[#6e6e73] mt-2 italic">
                  {t("ringGuide.visual.nota")}
                </p>
              </div>

              <div>
                <p className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider mb-2">
                  {t("ringGuide.tabela.titulo")}
                </p>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <table className="w-full text-[0.8125rem]">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-[#86868b]">
                        <th className="text-left px-3 py-2 font-medium">{t("ringGuide.col.tamanho")}</th>
                        <th className="text-center px-3 py-2 font-medium">{t("ringGuide.col.circunferencia")}</th>
                        <th className="text-right px-3 py-2 font-medium">{t("ringGuide.col.usa")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RING_SIZES.map((row, i) => (
                        <tr key={row.tamanho} className={i % 2 ? "bg-white/[0.02]" : ""}>
                          <td className="text-left px-3 py-2 font-semibold text-white">{row.tamanho}</td>
                          <td className="text-center px-3 py-2 text-[#d2d2d7]">{fmt(row.circunferencia)} cm</td>
                          <td className="text-right px-3 py-2 text-[#86868b]">{row.usa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[0.75rem] text-[#6e6e73] leading-relaxed">
                {t("ringGuide.dica")}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
