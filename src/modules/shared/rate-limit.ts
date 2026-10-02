import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/modules/shared/errors";

export async function enforceRateLimit(
  identity: string,
  limit: number,
  windowSeconds: number,
) {
  const key = createHash("sha256").update(identity).digest("hex");
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) *
      windowSeconds *
      1000,
  );

  await prisma.$transaction(async (tx) => {
    await tx.rateLimitBucket.upsert({
      where: { key },
      create: { key, windowStarted: windowStart, count: 0 },
      update: {},
    });
    await tx.$queryRaw<Array<{ key: string }>>(
      Prisma.sql`SELECT \`key\` FROM RateLimitBucket WHERE \`key\` = ${key} FOR UPDATE`,
    );
    const bucket = await tx.rateLimitBucket.findUniqueOrThrow({ where: { key } });
    if (bucket.windowStarted.getTime() !== windowStart.getTime()) {
      await tx.rateLimitBucket.update({
        where: { key },
        data: { windowStarted: windowStart, count: 1 },
      });
      return;
    }
    if (bucket.count >= limit) {
      throw new AppError("Terlalu banyak permintaan. Coba lagi sebentar.", 429, "RATE_LIMITED");
    }
    await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
