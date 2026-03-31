import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Builds a jsPDF document with the given title, subtitle, columns, and rows.
 * Returns the doc instance without saving — useful for email sending.
 */
export function buildGenericPdfDoc(
  title: string,
  subtitle: string,
  columns: string[],
  rows: string[][],
): jsPDF {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('pt-BR');

  // Logo
  try {
    doc.addImage('/logo-legendarios.png', 'PNG', 14, 10, 20, 16);
  } catch { /* logo not available */ }

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 38, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subtitle} - Gerado em ${today}`, 38, 27);

  // Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 0] },
    styles: { fontSize: 8 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.text(`Total de registros: ${rows.length}`, 14, finalY);

  return doc;
}

export function exportGenericPdf(
  title: string,
  subtitle: string,
  columns: string[],
  rows: string[][],
  filename: string
) {
  const doc = buildGenericPdfDoc(title, subtitle, columns, rows);
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}
