import { randomInt } from "node:crypto";

export function generateOrderNumber(date = new Date()) {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("/")
    .reverse()
    .join("");

  return `KNV-${datePart}-${randomInt(0, 10_000).toString().padStart(4, "0")}`;
}
