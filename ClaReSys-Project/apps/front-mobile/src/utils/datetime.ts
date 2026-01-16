export function parseDate(value: string) {
  // value puede venir con +00:00 (UTC) -> Date lo entiende.
  return new Date(value);
}

export function formatTimeRange(startISO: string, endISO: string) {
  const start = parseDate(startISO);
  const end = parseDate(endISO);

  const startStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${startStr} - ${endStr}`;
}

export function isNowBetween(startISO: string, endISO: string) {
  const now = new Date();
  const start = parseDate(startISO);
  const end = parseDate(endISO);
  return start <= now && now <= end;
}

export function isFuture(startISO: string) {
  const now = new Date();
  const start = parseDate(startISO);
  return start > now;
}

export function formatMonthDay(startISO: string) {
  const d = parseDate(startISO);
  const month = d.toLocaleString("es-EC", { month: "short" }).toUpperCase(); // "ENE"
  const day = String(d.getDate()).padStart(2, "0"); // "09"
  return { month, day };
}
