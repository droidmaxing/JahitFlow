function jakartaDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDateString(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localDayStart(value: string) {
  return new Date(`${value}T00:00:00+07:00`);
}

export function getReportPeriod(
  requestedFrom: string | undefined,
  requestedTo: string | undefined,
  now = new Date(),
) {
  const today = jakartaDateString(now);
  const defaultFrom = `${today.slice(0, 7)}-01`;
  const validFrom = isValidDateString(requestedFrom) ? requestedFrom : undefined;
  const validTo = isValidDateString(requestedTo) ? requestedTo : undefined;
  const hasInvalidRange = Boolean(
    (requestedFrom && !isValidDateString(requestedFrom)) ||
      (requestedTo && !isValidDateString(requestedTo)) ||
      (validFrom && validTo && validFrom > validTo),
  );
  const from = !hasInvalidRange && validFrom ? validFrom : defaultFrom;
  const to = !hasInvalidRange && validTo ? validTo : today;

  return {
    from,
    to,
    today,
    hasInvalidRange,
    startDate: localDayStart(from),
    endDate: localDayStart(addDays(to, 1)),
    currentDate: localDayStart(today),
  };
}

export function isValidReportDate(value: string) {
  return isValidDateString(value);
}

export function reportDateStart(value: string) {
  return localDayStart(value);
}

export function reportDateEndExclusive(value: string) {
  return localDayStart(addDays(value, 1));
}
