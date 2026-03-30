export function formatDate(ts: number | null | undefined, locale: string): string {
  if (!ts) return "\u2014";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(ts: number | null | undefined, locale: string): string {
  if (!ts) return "\u2014";
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleString(loc, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function dateToTimestamp(d: string): number {
  return new Date(d).getTime();
}

export function dateToTs(d: string): number | null {
  return d ? new Date(d + "T12:00:00").getTime() : null;
}

export function tsToDate(ts: number | null | undefined): string {
  return ts ? new Date(ts).toISOString().split("T")[0] : "";
}

export function tsToInputDT(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
