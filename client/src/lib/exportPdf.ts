import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoDataUrl } from './pdfLogo';

export async function exportKitsPdf(kits: any[], getEmbName: (id: number) => string) {
  const doc = new jsPDF({ compress: true });
  const today = new Date().toLocaleDateString('pt-BR');

  // Logo (downscaled + compressed)
  try {
    const logoDataUrl = await getLogoDataUrl();
    doc.addImage(logoDataUrl, 'PNG', 14, 10, 20, 16, undefined, 'FAST');
  } catch { /* logo not available */ }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Entrega de Kits', 38, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Embaixadores dos Legendários - Gerado em ${today}`, 38, 27);

  // Table
  const tableData = kits.map((kit: any) => {
    const name = getEmbName(kit.embaixadorId);
    return [
      name,
      kit.patchEntregue ? 'Sim' : 'Não',
      kit.pinBoneEntregue ? 'Sim' : 'Não',
      kit.anelEntregue ? 'Sim' : 'Não',
      kit.espadaEntregue ? 'Sim' : 'Não',
      kit.mochilaBalacEntregue ? 'Sim' : 'Não',
    ];
  });

  autoTable(doc, {
    startY: 38,
    head: [['Embaixador', 'Patch', 'PIN', 'Anel', 'Espada', 'Mochila']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 0] },
    styles: { fontSize: 9 },
  });

  // Summary
  const total = kits.length;
  const completos = kits.filter((k: any) =>
    ['patchEntregue', 'pinBoneEntregue', 'anelEntregue', 'espadaEntregue', 'mochilaBalacEntregue'].every(key => k[key])
  ).length;
  const pendentes = kits.filter((k: any) =>
    ['patchEntregue', 'pinBoneEntregue', 'anelEntregue', 'espadaEntregue', 'mochilaBalacEntregue'].every(key => !k[key])
  ).length;

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total: ${total} | Completos: ${completos} | Parciais: ${total - completos - pendentes} | Pendentes: ${pendentes}`, 14, finalY);

  // Signature line
  doc.text('_______________________________', 14, finalY + 30);
  doc.text('Assinatura do Responsável', 14, finalY + 36);
  doc.text('_______________________________', 120, finalY + 30);
  doc.text('Data', 120, finalY + 36);

  doc.save(`relatorio-kits-${new Date().toISOString().split('T')[0]}.pdf`);
}
