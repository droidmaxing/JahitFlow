import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/modules/shared/errors";
import { requireFeature } from "@/modules/feature/feature-gate";
import { clientAddress, enforceRateLimit } from "@/modules/shared/rate-limit";
import { hashAccessToken } from "@/modules/queue/application/public-queue";
import { BusinessContext, requireRole } from "@/modules/tenancy/context";

export async function createDisplay(
  context: BusinessContext,
  branchId: string,
  name: string,
) {
  requireRole(context, ["SUPER_ADMIN"]);
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      businessId: context.businessId,
      ...(context.branchIds ? { id: { in: context.branchIds } } : {}),
      active: true,
    },
    select: { id: true },
  });
  if (!branch) throw new AppError("Cabang tidak ditemukan.", 404, "BRANCH_NOT_FOUND");
  await requireFeature(context.businessId, "TV_DISPLAY");

  const token = randomBytes(32).toString("base64url");
  const display = await prisma.$transaction(async (tx) => {
    const created = await tx.display.create({
      data: {
        businessId: context.businessId,
        branchId,
        name,
        tokenHash: hashAccessToken(token),
      },
      select: { id: true, branchId: true, name: true, createdAt: true },
    });
    await tx.auditLog.create({
      data: {
        businessId: context.businessId,
        actorUserId: context.userId,
        branchId,
        action: "DISPLAY_CREATED",
        targetType: "Display",
        targetId: created.id,
      },
    });
    return created;
  });

  return { display, token };
}

export async function resolveDisplayToken(token: string) {
  const display = await prisma.display.findUnique({
    where: { tokenHash: hashAccessToken(token) },
    include: {
      business: { select: { id: true, name: true, active: true } },
      branch: { select: { id: true, name: true, active: true } },
    },
  });
  if (
    !display ||
    !display.active ||
    !display.business.active ||
    !display.branch.active
  ) {
    throw new AppError("Display tidak ditemukan atau tidak aktif.", 404, "INVALID_DISPLAY_TOKEN");
  }
  await requireFeature(display.business.id, "TV_DISPLAY");
  return display;
}

export async function getDisplaySnapshot(token: string, request: Request) {
  const display = await resolveDisplayToken(token);
  await enforceRateLimit(
    `display-snapshot:${display.id}:${clientAddress(request)}`,
    120,
    60,
  );
  const queues = await prisma.queue.findMany({
    where: {
      businessId: display.businessId,
      branchId: display.branchId,
      status: { in: ["CALLED", "SERVING"] },
    },
    include: {
      service: { select: { name: true } },
      counter: { select: { name: true, code: true } },
    },
    orderBy: [{ calledAt: "desc" }, { issuedAt: "desc" }],
    take: 8,
  });
  const features = await prisma.featureConfiguration.findMany({
    where: {
      businessId: display.businessId,
      featureKey: { in: ["VOICE_CALL", "ADVERTISEMENT"] },
    },
    select: { featureKey: true, enabled: true },
  });
  return {
    display: { name: display.name, branch: display.branch.name, business: display.business.name },
    queues: queues.map((queue) => ({
      ticketNumber: queue.ticketNumber,
      status: queue.status,
      service: queue.service.name,
      counter: queue.counter?.name ?? "—",
      counterCode: queue.counter?.code ?? "",
    })),
    voiceEnabled: features.find((feature) => feature.featureKey === "VOICE_CALL")?.enabled ?? false,
    advertisementEnabled: features.find((feature) => feature.featureKey === "ADVERTISEMENT")?.enabled ?? false,
    cursor: new Date().toISOString(),
  };
}

export async function getDisplayEvents(
  token: string,
  after: string,
) {
  const display = await resolveDisplayToken(token);
  return queryDisplayEvents(display.branchId, after);
}

async function queryDisplayEvents(branchId: string, after: string) {
  const cursorParts = after.split("|");
  const cursorDate = new Date(cursorParts[0]);
  const cursorId = cursorParts[1] ?? "";
  if (Number.isNaN(cursorDate.getTime())) {
    throw new AppError("Kursor event tidak valid.", 400, "INVALID_CURSOR");
  }

  const events = await prisma.outboxEvent.findMany({
    where: {
      branchId,
      createdAt: {
        gte: cursorDate,
      },
      OR: [
        { createdAt: { gt: cursorDate } },
        { createdAt: cursorDate, id: { gt: cursorId } },
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 100,
    select: {
      id: true,
      createdAt: true,
      eventType: true,
      payload: true,
    },
  });
  return events.map((event) => ({
    id: `${event.createdAt.toISOString()}|${event.id}`,
    type: event.eventType,
    payload: event.payload,
  }));
}

export async function getDisplayEventStream(
  token: string,
  request: Request,
  after: string,
) {
  const display = await resolveDisplayToken(token);
  await enforceRateLimit(
    `display-stream:${display.id}:${clientAddress(request)}`,
    12,
    60,
  );
  const encoder = new TextEncoder();
  let cursor = after || new Date().toISOString();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };
      request.signal.addEventListener("abort", close, { once: true });

      void (async () => {
        try {
          while (!closed) {
            await requireFeature(display.business.id, "TV_DISPLAY");
            const events = await queryDisplayEvents(display.branchId, cursor);
            for (const event of events) {
              cursor = event.id;
              controller.enqueue(
                encoder.encode(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`),
              );
            }
            if (!events.length) {
              controller.enqueue(encoder.encode(": keep-alive\n\n"));
            }
            const voiceFeature = await prisma.featureConfiguration.findUnique({
              where: {
                businessId_featureKey: {
                  businessId: display.business.id,
                  featureKey: "VOICE_CALL",
                },
              },
              select: { enabled: true },
            });
            controller.enqueue(
              encoder.encode(
                `event: capabilities\ndata: ${JSON.stringify({ voiceEnabled: voiceFeature?.enabled ?? false })}\n\n`,
              ),
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error("TV display event stream failed", {
            displayId: display.id,
            error,
          });
          if (!closed) {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ message: "Koneksi display terganggu." })}\n\n`,
              ),
            );
            close();
          }
        }
      })();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
