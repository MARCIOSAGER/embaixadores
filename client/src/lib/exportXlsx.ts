import * as XLSX from 'xlsx';

/**
 * Export rows to XLSX.
 *
 * - Single-sheet form: `exportToXlsx(rows, "filename")` or with a custom
 *   sheet name.
 * - Multi-sheet form: `exportToXlsx({ Sheet1: rows1, Sheet2: rows2 }, "filename")`.
 */
export function exportToXlsx(
  data: Record<string, any>[] | Record<string, Record<string, any>[]>,
  filename: string,
  sheetName = 'Dados',
) {
  const wb = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  } else {
    for (const [name, rows] of Object.entries(data)) {
      const ws = XLSX.utils.json_to_sheet(rows);
      // Excel sheet names are limited to 31 chars
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
