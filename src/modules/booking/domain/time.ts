export type OperatingWindow = {
  opensAt: string;
  closesAt: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidLocalDate(value: string) {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function localDateTimeToUtc(
  localDate: string,
  localTime: string,
  timezone: string,
) {
  if (!isValidLocalDate(localDate) || !timePattern.test(localTime)) {
    throw new RangeError("Invalid local date or time.");
  }
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const expected = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = expected;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const localAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const offset = localAsUtc - candidate;
    const next = expected - offset;
    if (next === candidate) break;
    candidate = next;
  }

  const result = new Date(candidate);
  if (formatLocalDateTime(result, timezone) !== `${localDate}T${localTime}`) {
    throw new RangeError("The local time does not exist in the selected timezone.");
  }
  return result;
}

export function formatLocalDateTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function getWeekday(localDate: string) {
  return new Date(`${localDate}T00:00:00.000Z`).getUTCDay();
}

export function addLocalDays(localDate: string, days: number) {
  const date = new Date(`${localDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function localDateInTimezone(date: Date, timezone: string) {
  return formatLocalDateTime(date, timezone).slice(0, 10);
}

export function buildThirtyMinuteSlots(
  localDate: string,
  timezone: string,
  window: OperatingWindow,
  now = new Date(),
) {
  new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(now);
  if (!timePattern.test(window.opensAt) || !timePattern.test(window.closesAt)) {
    throw new RangeError("Operating hours must use HH:mm format.");
  }
  const [openHour, openMinute] = window.opensAt.split(":").map(Number);
  const [closeHour, closeMinute] = window.closesAt.split(":").map(Number);
  const opensAtMinutes = openHour * 60 + openMinute;
  const closesAtMinutes = closeHour * 60 + closeMinute;
  if (closesAtMinutes <= opensAtMinutes) return [];

  const slots: { localTime: string; startsAt: Date }[] = [];
  const earliestBookingTime = now.getTime() + 30 * 60_000;
  for (
    let minutes = opensAtMinutes;
    minutes + 30 <= closesAtMinutes;
    minutes += 30
  ) {
    const localTime = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    try {
      const startsAt = localDateTimeToUtc(localDate, localTime, timezone);
      if (startsAt.getTime() >= earliestBookingTime) {
        slots.push({ localTime, startsAt });
      }
    } catch {
      // Local times skipped during a daylight-saving transition are not bookable.
    }
  }
  return slots;
}
