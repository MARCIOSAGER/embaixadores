import type { SupabaseClient } from "@supabase/supabase-js";
import type jsPDF from "jspdf";

/**
 * Sends a jsPDF document as an email attachment via the send-report Edge Function.
 */
export async function sendReportByEmail(
  supabase: SupabaseClient,
  pdfDoc: jsPDF,
  to: string,
  subject: string,
  filename: string
): Promise<void> {
  // Get base64 from the PDF doc
  const dataUri = pdfDoc.output("datauristring");
  // Strip the "data:application/pdf;filename=generated.pdf;base64," prefix
  const pdfBase64 = dataUri.split(",")[1];

  const { data, error } = await supabase.functions.invoke("send-report", {
    body: { to, subject, body: subject, pdfBase64, filename },
  });

  if (error) {
    throw new Error(error.message || "Erro ao enviar relatorio");
  }

  if (data && !data.success) {
    throw new Error(data.error || "Erro ao enviar relatorio");
  }
}
