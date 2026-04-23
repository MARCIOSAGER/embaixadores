import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getLogoDataUrl } from "./pdfLogo";
import { formatDate } from "./dateUtils";
import type { Locale } from "./i18n";

type Emb = Record<string, any>;

/**
 * Individual ambassador ficha PDF. Uses the same visual language as the
 * list export (logo left, orange title, orange section headers, grid
 * theme) so the output looks consistent across the app.
 */
export async function exportEmbaixadorPdf(emb: Emb, locale: Locale = "pt"): Promise<void> {
  const doc = new jsPDF({ compress: true });
  const today = new Date().toLocaleDateString("pt-BR");
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const orange: [number, number, number] = [255, 107, 0];

  // ─── Top band: logo + title + subtitle ────────────────────────────────
  try {
    const logoDataUrl = await getLogoDataUrl();
    doc.addImage(logoDataUrl, "PNG", marginX, 10, 20, 16, undefined, "FAST");
  } catch { /* logo not available */ }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Ficha do Embaixador", 38, 20);

  const subtitle = [
    emb.numeroLegendario ? `L#${emb.numeroLegendario}` : null,
    emb.numeroEmbaixador ? `E#${emb.numeroEmbaixador}` : null,
    statusLabel(emb.status),
  ].filter(Boolean).join("  ·  ");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Embaixadores dos Legendários - Gerado em ${today}`, 38, 27);

  // Orange rule under the header band
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.6);
  doc.line(marginX, 30, pageWidth - marginX, 30);

  // ─── Ambassador name band ─────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(emb.nomeCompleto || "—", marginX, 40);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, marginX, 46);
  }
  doc.setTextColor(0, 0, 0);

  let y = 52;

  // Helper: render one section as a "Label | Value" two-column table
  const section = (title: string, rows: Array<[string, string | number | null | undefined]>) => {
    const nonEmpty = rows.filter(r => r[1] !== undefined && r[1] !== null && String(r[1]).trim() !== "");
    if (nonEmpty.length === 0) return;

    autoTable(doc, {
      startY: y,
      head: [[title]],
      body: nonEmpty.map(r => [r[0], String(r[1])]),
      theme: "grid",
      headStyles: { fillColor: orange, fontSize: 9, halign: "left" },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold", textColor: [70, 70, 70] },
        1: { cellWidth: "auto" as any, textColor: [20, 20, 20] },
      },
      // Span title across both columns
      didParseCell: (data) => {
        if (data.section === "head") {
          data.cell.colSpan = 2;
        }
      },
      margin: { left: marginX, right: marginX },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  };

  // Helper: free-form text block under a section header (for programas, observações)
  const textBlock = (title: string, body: string) => {
    if (!body || !body.trim()) return;
    autoTable(doc, {
      startY: y,
      head: [[title]],
      body: [[body]],
      theme: "grid",
      headStyles: { fillColor: orange, fontSize: 9, halign: "left" },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: marginX, right: marginX },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  };

  // ─── Sections ─────────────────────────────────────────────────────────
  section("Contato", [
    ["Email", emb.email],
    ["Telefone", emb.telefone],
    ["Instagram", emb.instagram],
    ["Idioma", idiomaLabel(emb.idioma)],
  ]);

  section("Endereço", [
    ["Endereço", emb.endereco],
    ["Bairro", emb.bairro],
    ["Cidade", emb.cidade],
    ["Estado", emb.estado],
    ["CEP", emb.cep],
    ["País", emb.pais],
  ]);

  section("Datas", [
    ["Nascimento", formatDate(emb.dataNascimento, locale)],
    ["Ingresso", formatDate(emb.dataIngresso, locale)],
    ["Renovação", formatDate(emb.dataRenovacao, locale)],
    ["Data que virou Embaixador", emb.dataEmbaixador],
  ]);

  section("Família", [
    ["Estado Civil", estadoCivilLabel(emb.estadoCivil)],
    ["Nome da Esposa", emb.nomeEsposa],
    ["Nascimento da Esposa", formatDate(emb.dataNascimentoEsposa, locale)],
    ["Qtd. de Filhos", emb.qtdFilhos > 0 ? emb.qtdFilhos : null],
    ["Idades dos Filhos", emb.idadesFilhos],
  ]);

  section("Jornada Embaixador", [
    ["Sede Legendário", emb.sedeLegendario],
    ["Cargo de Liderança", emb.cargoLideranca],
    ["Doação de Poço", simNaoLabel(emb.doacaoPoco)],
    ["Medida do Anel", emb.numeroAnel],
  ]);

  section("Itens Embaixador", [
    ["Jaqueta", simNaoLabel(emb.temJaqueta)],
    ["Pin", simNaoLabel(emb.temPin)],
    ["Patch", simNaoLabel(emb.temPatch)],
    ["Espada", simNaoLabel(emb.temEspada)],
  ]);

  section("Profissional", [
    ["Profissão", emb.profissao],
    ["Empresa", emb.empresa],
  ]);

  if (emb.programasParticipou) {
    textBlock("Programas Participou", emb.programasParticipou.replace(/,/g, ", "));
  }
  if (emb.aberturasPaises) {
    textBlock("Aberturas (países)", emb.aberturasPaises.replace(/,/g, ", "));
  }

  if (emb.observacoes) {
    textBlock("Observações", emb.observacoes);
  }

  if (emb.codigoIndicacao) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    section("Link de Indicação", [
      ["Código", emb.codigoIndicacao],
      ["URL", `${origin}/inscricao?ref=${emb.codigoIndicacao}`],
    ]);
  }

  // ─── Footer ───────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(
    `Embaixadores dos Legendários  ·  Ficha gerada em ${today}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const safeName = (emb.nomeCompleto || "embaixador").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`ficha-${safeName}-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Label helpers ──────────────────────────────────────────────────────
function statusLabel(s: string | null | undefined): string {
  if (s === "ativo") return "Ativo";
  if (s === "inativo") return "Inativo";
  if (s === "pendente_renovacao") return "Pendente Renovação";
  return "";
}

function idiomaLabel(i: string | null | undefined): string | null {
  if (i === "pt") return "Português";
  if (i === "es") return "Español";
  if (i === "en") return "English";
  return null;
}

function estadoCivilLabel(s: string | null | undefined): string | null {
  if (!s) return null;
  const map: Record<string, string> = {
    solteiro: "Solteiro",
    casado: "Casado",
    divorciado: "Divorciado",
    viuvo: "Viúvo",
  };
  return map[s] || s;
}

function simNaoLabel(v: string | null | undefined): string | null {
  if (!v) return null;
  return v === "sim" ? "Sim" : "Não";
}
