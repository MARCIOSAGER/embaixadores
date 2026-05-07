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

function buildPrintableHtml(title: string): string {
  const COLS = 5;
  const cells = RING_SIZES.map(row => {
    const diameterCm = row.circunferencia / Math.PI;
    return `
      <div class="cell">
        <div class="ring" style="width:${diameterCm.toFixed(3)}cm;height:${diameterCm.toFixed(3)}cm;">
          <span>${row.tamanho}</span>
        </div>
        <div class="lbl">${fmt(row.circunferencia)} cm</div>
      </div>`;
  }).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 6px; }
  p.intro { font-size: 12px; color: #444; margin: 0 0 14px; line-height: 1.4; }
  .grid { display: grid; grid-template-columns: repeat(${COLS}, 1fr); gap: 14px 10px; }
  .cell { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
  .ring { border: 1.2pt solid #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .ring span { font-weight: 700; font-size: 10pt; }
  .lbl { font-size: 8pt; color: #444; margin-top: 4px; }
  table { border-collapse: collapse; margin-top: 18px; width: 100%; font-size: 10pt; }
  th, td { border: 0.6pt solid #999; padding: 4px 8px; }
  th { background: #f1f1f1; text-align: left; }
  .note { font-size: 9pt; color: #555; margin-top: 8px; font-style: italic; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="intro">
    1. Enrole uma linha ou tira de papel fino ao redor do dedo (sem apertar).<br/>
    2. Marque o ponto onde a linha se encontra.<br/>
    3. Meça o comprimento com uma régua — esse é o valor em cm.
  </p>
  <div class="grid">${cells}</div>
  <p class="note">Os círculos estão impressos em tamanho real. Coloque um anel sobre o círculo para conferir o tamanho.</p>
  <table>
    <thead><tr><th>Tamanho BR</th><th>Circunferência</th><th>Equivalente US</th></tr></thead>
    <tbody>
      ${RING_SIZES.map(r => `<tr><td>${r.tamanho}</td><td>${fmt(r.circunferencia)} cm</td><td>${r.usa}</td></tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
}

function openPrintWindow(title: string) {
  const html = buildPrintableHtml(title);
  // Hidden iframe avoids popup blockers and never affects the host page.
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  iframe.onload = () => {
    try {
      const cw = iframe.contentWindow;
      if (!cw) { cleanup(); return; }
      cw.focus();
      cw.print();
      // Some browsers fire afterprint on the iframe window
      cw.addEventListener("afterprint", cleanup);
      // Fallback cleanup after a delay
      setTimeout(cleanup, 60_000);
    } catch {
      cleanup();
    }
  };

  iframe.srcdoc = html;
  void title;
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
          className="ring-guide-modal fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("ringGuide.titulo")}
        >
          <div
            className="w-full sm:max-w-lg bg-[#1c1c1e] border border-white/[0.08] rounded-t-[20px] sm:rounded-[20px] max-h-[90vh] overflow-y-auto"
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
