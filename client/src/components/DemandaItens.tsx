import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Download, FileDown, AlertTriangle, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { exportToXlsx } from "@/lib/exportXlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getLogoDataUrl } from "@/lib/pdfLogo";
import { toast } from "sonner";

type Emb = {
  id: number;
  nomeCompleto: string;
  numeroLegendario: string | null;
  numeroEmbaixador: string | null;
  cidade: string | null;
  temJaqueta: string | null;
  temPin: string | null;
  temPatch: string | null;
  temEspada: string | null;
  numeroAnel: string | null;
};

/** Compact identifier line: E#… · L#… (either may be missing). */
function embIdLine(p: Emb): string {
  const parts: string[] = [];
  if (p.numeroEmbaixador) parts.push(`E#${p.numeroEmbaixador}`);
  if (p.numeroLegendario) parts.push(`L#${p.numeroLegendario}`);
  return parts.join(" · ");
}

type Mode = "pendente" | "inventario";

const ITEMS: Array<{ key: keyof Emb; label: string; emoji: string }> = [
  { key: "temJaqueta", label: "Jaqueta", emoji: "🧥" },
  { key: "temPin", label: "Pin", emoji: "📌" },
  { key: "temPatch", label: "Patch", emoji: "🏔" },
  { key: "temEspada", label: "Espada", emoji: "⚔️" },
];

function normalizeAnel(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9,.]/g, "").replace(",", ".");
  if (!digits) return raw.trim();
  return digits;
}

export default function DemandaItens({ embaixadores }: { embaixadores: Emb[] }) {
  const [mode, setMode] = useState<Mode>("pendente");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { itemStats, ringBuckets, ringList } = useMemo(() => {
    const targetValue = mode === "pendente" ? "nao" : "sim";

    const itemStats = ITEMS.map(item => {
      const matching = embaixadores.filter(e => e[item.key] === targetValue);
      return { ...item, count: matching.length, people: matching };
    });

    // Ring: only counts ambassadors with a measurement filled (for ordering).
    // In "pendente" mode we include everyone who provided a size — they'll need a ring.
    // In "inventario" mode we include everyone who has a size (same set).
    const relevant = embaixadores.filter(e => !!e.numeroAnel && e.numeroAnel.trim() !== "");
    const bucketMap = new Map<string, Emb[]>();
    for (const e of relevant) {
      const k = normalizeAnel(e.numeroAnel) || "—";
      const arr = bucketMap.get(k) || [];
      arr.push(e);
      bucketMap.set(k, arr);
    }
    const ringBuckets = Array.from(bucketMap.entries())
      .map(([size, people]) => ({ size, count: people.length }))
      .sort((a, b) => {
        const na = parseFloat(a.size);
        const nb = parseFloat(b.size);
        if (isNaN(na) && isNaN(nb)) return a.size.localeCompare(b.size);
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return na - nb;
      });

    return { itemStats, ringBuckets, ringList: relevant };
  }, [embaixadores, mode]);

  const totalPessoas = embaixadores.length;
  const semResposta = embaixadores.filter(e => ITEMS.every(i => !e[i.key])).length;

  function handleExport() {
    const resumo = itemStats.map(s => ({
      Item: s.label,
      [mode === "pendente" ? "Pendentes" : "Já possuem"]: s.count,
    }));

    const perItem: Record<string, any[]> = {};
    for (const s of itemStats) {
      perItem[s.label] = s.people.map(p => ({
        "Nº Embaixador": p.numeroEmbaixador || "",
        "Nº Legendário": p.numeroLegendario || "",
        Nome: p.nomeCompleto,
        Cidade: p.cidade || "",
      }));
    }

    const aneisResumo = ringBuckets.map(b => ({ Tamanho: b.size, Quantidade: b.count }));
    const aneisDetalhe = ringList.map(p => ({
      "Nº Embaixador": p.numeroEmbaixador || "",
      "Nº Legendário": p.numeroLegendario || "",
      Nome: p.nomeCompleto,
      Cidade: p.cidade || "",
      Tamanho: normalizeAnel(p.numeroAnel) || "",
    }));

    const sheets: Record<string, any[]> = {
      Resumo: resumo,
      "Anéis - Tamanhos": aneisResumo,
      "Anéis - Embaixadores": aneisDetalhe,
      ...perItem,
    };

    exportToXlsx(sheets, `demanda-itens-${mode}-${new Date().toISOString().split("T")[0]}`);
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ compress: true });
      const today = new Date().toLocaleDateString("pt-BR");
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;
      const orange: [number, number, number] = [255, 107, 0];

      // Header
      try {
        const logoDataUrl = await getLogoDataUrl();
        doc.addImage(logoDataUrl, "PNG", marginX, 10, 20, 16, undefined, "FAST");
      } catch { /* logo not available */ }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const title = mode === "pendente" ? "Demanda de Itens - Pendentes" : "Demanda de Itens - Inventário";
      doc.text(title, 38, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Embaixadores dos Legendários - Gerado em ${today}`, 38, 27);

      doc.setDrawColor(...orange);
      doc.setLineWidth(0.6);
      doc.line(marginX, 30, pageWidth - marginX, 30);

      let y = 36;

      // Resumo geral
      const resumoHeader = mode === "pendente" ? "Pendentes" : "Já possuem";
      autoTable(doc, {
        startY: y,
        head: [["Resumo Geral", ""]],
        body: itemStats.map(s => [s.label, String(s.count)]),
        theme: "grid",
        headStyles: { fillColor: orange, fontSize: 10, halign: "left" },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: "bold" },
          1: { cellWidth: "auto" as any, halign: "right", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "head" && data.column.index === 1) {
            data.cell.text = [resumoHeader];
            data.cell.styles.halign = "right";
          }
        },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Tamanhos de anel
      if (ringBuckets.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Tamanho do Anel", "Quantidade"]],
          body: ringBuckets.map(b => [b.size, String(b.count)]),
          theme: "grid",
          headStyles: { fillColor: orange, fontSize: 10, halign: "left" },
          styles: { fontSize: 9, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 80, fontStyle: "bold" },
            1: { cellWidth: "auto" as any, halign: "right" },
          },
          margin: { left: marginX, right: marginX },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // Listas detalhadas por item
      for (const s of itemStats) {
        if (s.people.length === 0) continue;
        autoTable(doc, {
          startY: y,
          head: [[`${s.label} — ${s.count} ${mode === "pendente" ? "pendente(s)" : "possui(em)"}`, "", "", ""]],
          body: s.people.map(p => [
            p.numeroEmbaixador ? `E#${p.numeroEmbaixador}` : "—",
            p.numeroLegendario ? `L#${p.numeroLegendario}` : "—",
            p.nomeCompleto,
            p.cidade || "",
          ]),
          theme: "grid",
          headStyles: { fillColor: orange, fontSize: 10, halign: "left" },
          styles: { fontSize: 9, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 28 },
            2: { cellWidth: "auto" as any, fontStyle: "bold" },
            3: { cellWidth: 45 },
          },
          didParseCell: (data) => {
            if (data.section === "head" && data.column.index > 0) {
              data.cell.text = [""];
            }
          },
          margin: { left: marginX, right: marginX },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
      }

      // Detalhes dos anéis (quem informou qual tamanho)
      if (ringList.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Medidas de Anel por Embaixador", "", "", ""]],
          body: ringList
            .slice()
            .sort((a, b) => {
              const na = parseFloat(normalizeAnel(a.numeroAnel) || "");
              const nb = parseFloat(normalizeAnel(b.numeroAnel) || "");
              if (isNaN(na) && isNaN(nb)) return 0;
              if (isNaN(na)) return 1;
              if (isNaN(nb)) return -1;
              return na - nb;
            })
            .map(p => [
              p.numeroEmbaixador ? `E#${p.numeroEmbaixador}` : "—",
              p.numeroLegendario ? `L#${p.numeroLegendario}` : "—",
              p.nomeCompleto,
              normalizeAnel(p.numeroAnel) || "",
            ]),
          theme: "grid",
          headStyles: { fillColor: orange, fontSize: 10, halign: "left" },
          styles: { fontSize: 9, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 28 },
            2: { cellWidth: "auto" as any, fontStyle: "bold" },
            3: { cellWidth: 28, halign: "right" },
          },
          didParseCell: (data) => {
            if (data.section === "head" && data.column.index > 0) {
              data.cell.text = [""];
            }
          },
          margin: { left: marginX, right: marginX },
        });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Embaixadores dos Legendários  ·  Gerado em ${today}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );

      doc.save(`demanda-itens-${mode}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Mode switch */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex bg-white/[0.04] rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode("pendente")}
            className={`px-4 py-1.5 rounded-lg text-[0.8125rem] font-medium transition-all ${
              mode === "pendente" ? "bg-[#FF6B00] text-white" : "text-[#86868b] hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={2} />
            Pendentes (encomendar)
          </button>
          <button
            onClick={() => setMode("inventario")}
            className={`px-4 py-1.5 rounded-lg text-[0.8125rem] font-medium transition-all ${
              mode === "inventario" ? "bg-[#30D158] text-white" : "text-[#86868b] hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={2} />
            Já têm (inventário)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2"
            title="Exportar PDF"
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={handleExport}
            className="apple-btn apple-btn-gray px-3 py-2 text-sm rounded-xl flex items-center gap-2"
            title="Exportar XLSX"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">XLSX</span>
          </button>
        </div>
      </div>

      {/* Top cards — one per item */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {itemStats.map(item => {
          const color = mode === "pendente" ? "#FF9F0A" : "#30D158";
          const bg = mode === "pendente" ? "rgba(255,159,10,0.08)" : "rgba(48,209,88,0.08)";
          return (
            <div key={String(item.key)} className="apple-card-inset p-4" style={{ background: bg, borderColor: `${color}33` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[0.6875rem] text-[#86868b] uppercase tracking-wider">{item.label}</p>
                  <p className="text-3xl font-bold mt-1 tabular-nums" style={{ color }}>{item.count}</p>
                  <p className="text-[0.6875rem] text-[#6e6e73] mt-0.5">
                    {mode === "pendente" ? "a encomendar" : "já possuem"}
                  </p>
                </div>
                <span className="text-2xl opacity-60">{item.emoji}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ring size histogram */}
      <div className="apple-card-inset p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💍</span>
            <h3 className="text-[0.9375rem] font-semibold text-white">Tamanhos de Anel</h3>
          </div>
          <span className="text-[0.75rem] text-[#86868b]">
            {ringList.length} {ringList.length === 1 ? "embaixador informou" : "embaixadores informaram"}
          </span>
        </div>

        {ringBuckets.length === 0 ? (
          <p className="text-[0.8125rem] text-[#6e6e73] italic py-4 text-center">
            Ninguém informou tamanho do anel ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {ringBuckets.map(bucket => {
              const max = Math.max(...ringBuckets.map(b => b.count));
              const pct = (bucket.count / max) * 100;
              return (
                <div key={bucket.size} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-[0.8125rem] font-semibold text-white tabular-nums">
                    {bucket.size}
                  </div>
                  <div className="flex-1 h-7 bg-white/[0.04] rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF6B00, #FF9F0A)" }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[0.75rem] text-white font-medium">
                      {bucket.count} {bucket.count === 1 ? "pessoa" : "pessoas"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {ringBuckets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <details>
              <summary className="text-[0.8125rem] text-[#86868b] cursor-pointer hover:text-white flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5" />
                Ver quem informou cada tamanho
              </summary>
              <div className="mt-3 space-y-1.5">
                {ringList
                  .slice()
                  .sort((a, b) => {
                    const na = parseFloat(normalizeAnel(a.numeroAnel) || "");
                    const nb = parseFloat(normalizeAnel(b.numeroAnel) || "");
                    if (isNaN(na) && isNaN(nb)) return 0;
                    if (isNaN(na)) return 1;
                    if (isNaN(nb)) return -1;
                    return na - nb;
                  })
                  .map(p => (
                    <Link
                      key={p.id}
                      href={`/embaixador/${p.id}`}
                      className="flex items-center justify-between text-[0.8125rem] py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors gap-3"
                    >
                      <span className="text-white truncate">{p.nomeCompleto}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[#86868b] text-[0.75rem]">{embIdLine(p)}</span>
                        <span className="text-[#FF9F0A] font-medium tabular-nums">{normalizeAnel(p.numeroAnel)}</span>
                      </span>
                    </Link>
                  ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Item detail lists */}
      <div className="space-y-3">
        <h3 className="text-[0.75rem] text-[#6e6e73] uppercase tracking-wider px-1">
          Detalhamento por item ({mode === "pendente" ? "quem ainda não tem" : "quem já tem"})
        </h3>
        {itemStats.map(item => (
          <div key={String(item.key)} className="apple-card-inset overflow-hidden">
            <button
              onClick={() => setOpenItem(openItem === String(item.key) ? null : String(item.key))}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-[0.9375rem] font-medium text-white">{item.label}</span>
                <span
                  className="apple-badge text-[0.6875rem]"
                  style={{
                    background: mode === "pendente" ? "rgba(255,159,10,0.14)" : "rgba(48,209,88,0.14)",
                    color: mode === "pendente" ? "#FF9F0A" : "#30D158",
                  }}
                >
                  {item.count}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#86868b] transition-transform ${openItem === String(item.key) ? "rotate-180" : ""}`}
                strokeWidth={1.5}
              />
            </button>
            {openItem === String(item.key) && (
              <div className="border-t border-white/[0.06] p-3 space-y-1">
                {item.people.length === 0 ? (
                  <p className="text-[0.8125rem] text-[#6e6e73] italic text-center py-3">
                    {mode === "pendente" ? "Ninguém pendente 🎉" : "Ninguém ainda"}
                  </p>
                ) : (
                  item.people.map(p => {
                    const idLine = embIdLine(p);
                    return (
                      <Link
                        key={p.id}
                        href={`/embaixador/${p.id}`}
                        className="flex items-center justify-between text-[0.8125rem] py-1.5 px-3 rounded hover:bg-white/[0.04] transition-colors gap-3"
                      >
                        <span className="text-white truncate">{p.nomeCompleto}</span>
                        <span className="text-[#86868b] text-[0.75rem] shrink-0">
                          {idLine}{idLine && p.cidade ? " · " : ""}{p.cidade || ""}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Coverage note */}
      {semResposta > 0 && (
        <div className="apple-card-inset p-4 flex items-start gap-3 bg-[#FF9F0A]/[0.06] border-[#FF9F0A]/20">
          <HelpCircle className="w-4 h-4 text-[#FF9F0A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-[0.8125rem] text-white font-medium">
              {semResposta} de {totalPessoas} embaixadores ainda não preencheram o perfil
            </p>
            <p className="text-[0.75rem] text-[#86868b] mt-0.5">
              Os números acima podem crescer conforme mais pessoas preencherem o link /meu-perfil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
