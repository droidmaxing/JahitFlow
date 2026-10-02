import { FeatureKey, Prisma, QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BusinessContext, requireRole } from "@/modules/tenancy/context";
import { AppError } from "@/modules/shared/errors";
import {
  assertQueueTransition,
  statusAfterAction,
  type QueueAction,
} from "@/modules/queue/domain/state-machine";

function dateForTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`);
}

export async function listQueues(
  context: BusinessContext,
  branchId: string,
) {
  requireRole(context, ["ADMIN", "SUPER_ADMIN", "OWNER"]);
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      businessId: context.businessId,
      active: true,
      ...(context.branchIds ? { id: { in: context.branchIds } } : {}),
    },
    select: { timezone: true, business: { select: { timezone: true } } },
  });
  if (!branch) throw new AppError("Cabang tidak ditemukan.", 404, "BRANCH_NOT_FOUND");

  const serviceDate = dateForTimezone(branch.timezone ?? branch.business.timezone);
  return prisma.queue.findMany({
    where: { businessId: context.businessId, branchId, serviceDate },
    include: {
      service: { select: { name: true, code: true } },
      counter: { select: { name: true, code: true } },
      customer: { select: { name: true } },
    },
    orderBy: [{ issuedAt: "asc" }, { id: "asc" }],
  });
}

type CallNextInput = {
  branchId: string;
  counterId: string;
  serviceId?: string;
};

export async function callNext(
  context: BusinessContext,
  input: CallNextInput,
) {
  requireRole(context, ["ADMIN", "SUPER_ADMIN"]);
  const branch = await prisma.branch.findFirst({
    where: {
      id: input.branchId,
      businessId: context.businessId,
      active: true,
      ...(context.branchIds ? { id: { in: context.branchIds } } : {}),
    },
    select: { id: true, timezone: true, business: { select: { timezone: true } } },
  });
  if (!branch) throw new AppError("Cabang tidak ditemukan.", 404, "BRANCH_NOT_FOUND");

  const counter = await prisma.counter.findFirst({
    where: { id: input.counterId, branchId: branch.id, active: true },
    select: { id: true },
  });
  if (!counter) throw new AppError("Loket tidak ditemukan atau nonaktif.", 404, "COUNTER_NOT_FOUND");

  const counterServices = await prisma.counterService.findMany({
    where: {
      counterId: counter.id,
      service: { businessId: context.businessId, active: true },
    },
    select: { serviceId: true },
  });
  const serviceIds = counterServices.map(({ serviceId }) => serviceId);
  if (!serviceIds.length) {
    throw new AppError("Loket ini belum memiliki layanan aktif.", 409, "NO_COUNTER_SERVICES");
  }
  if (input.serviceId && !serviceIds.includes(input.serviceId)) {
    throw new AppError("Layanan ini tidak tersedia di loket.", 400, "SERVICE_NOT_AT_COUNTER");
  }

  const features = await prisma.featureConfiguration.findMany({
    where: {
      businessId: context.businessId,
      featureKey: FeatureKey.MULTI_COUNTER,
    },
    select: { enabled: true },
  });
  const multiCounterEnabled = features[0]?.enabled ?? false;
  if (!multiCounterEnabled) {
    const firstCounter = await prisma.counter.findFirst({
      where: { branchId: branch.id, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstCounter?.id !== counter.id) {
      throw new AppError("Fitur multi loket belum aktif.", 403, "FEATURE_DISABLED");
    }
  }

  const serviceDate = dateForTimezone(branch.timezone ?? branch.business.timezone);
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM Counter WHERE id = ${counter.id} FOR UPDATE`,
      );
      const lockedCounter = await tx.counter.findUniqueOrThrow({
        where: { id: counter.id },
      });
      if (lockedCounter.activeQueueId) {
        throw new AppError("Loket sedang melayani antrean lain.", 409, "COUNTER_BUSY");
      }

      const eligibleServices = input.serviceId ? [input.serviceId] : serviceIds;
      const eligibleIds = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM Queue
          WHERE branchId = ${branch.id}
            AND businessId = ${context.businessId}
            AND serviceDate = ${serviceDate}
            AND status = 'WAITING'
            AND serviceId IN (${Prisma.join(eligibleServices)})
          ORDER BY issuedAt ASC, id ASC
          LIMIT 1
          FOR UPDATE`,
      );
      const queueId = eligibleIds[0]?.id;
      if (!queueId) {
        throw new AppError("Tidak ada antrean menunggu di layanan loket ini.", 404, "QUEUE_EMPTY");
      }

      const queue = await tx.queue.findUniqueOrThrow({
        where: { id: queueId },
        select: {
          id: true,
          status: true,
          ticketNumber: true,
          service: { select: { name: true } },
        },
      });
      const nextStatus = statusAfterAction("call", queue.status);
      const now = new Date();

      await tx.queue.update({
        where: { id: queue.id },
        data: {
          status: nextStatus,
          counterId: counter.id,
          calledAt: now,
          version: { increment: 1 },
        },
      });
      await tx.counter.update({
        where: { id: counter.id },
        data: { activeQueueId: queue.id },
      });
      await tx.queueHistory.create({
        data: {
          queueId: queue.id,
          actorUserId: context.userId,
          counterId: counter.id,
          fromStatus: queue.status,
          toStatus: nextStatus,
          action: "CALL",
        },
      });
      await tx.auditLog.create({
        data: {
          businessId: context.businessId,
          actorUserId: context.userId,
          branchId: branch.id,
          action: "QUEUE_CALL",
          targetType: "Queue",
          targetId: queue.id,
        },
      });
      await tx.outboxEvent.create({
        data: {
          businessId: context.businessId,
          branchId: branch.id,
          eventType: "queue.called",
          aggregateId: queue.id,
          payload: {
            queueId: queue.id,
            ticketNumber: queue.ticketNumber,
            counterId: counter.id,
            counterName: lockedCounter.name,
            serviceName: queue.service.name,
            status: nextStatus,
          },
        },
      });

      return { id: queue.id, ticketNumber: queue.ticketNumber, status: nextStatus };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}

export async function transitionQueue(
  context: BusinessContext,
  queueId: string,
  action: QueueAction,
) {
  requireRole(context, ["ADMIN", "SUPER_ADMIN"]);
  return prisma.$transaction(async (tx) => {
    const visibleQueue = await tx.queue.findFirst({
      where: {
        id: queueId,
        businessId: context.businessId,
        branch: { active: true },
        ...(context.branchIds ? { branchId: { in: context.branchIds } } : {}),
      },
      select: { id: true },
    });
    if (!visibleQueue) throw new AppError("Antrean tidak ditemukan.", 404, "QUEUE_NOT_FOUND");
    await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM Queue
        WHERE id = ${visibleQueue.id} AND businessId = ${context.businessId}
        LIMIT 1 FOR UPDATE`,
    );
    const queue = await tx.queue.findFirst({
      where: {
        id: visibleQueue.id,
        businessId: context.businessId,
        branch: { active: true },
        ...(context.branchIds ? { branchId: { in: context.branchIds } } : {}),
      },
    });
    if (!queue) throw new AppError("Antrean tidak ditemukan.", 404, "QUEUE_NOT_FOUND");
    assertQueueTransition(action, queue.status);

    if (action === "call") {
      throw new AppError("Gunakan panggil antrean berikutnya.", 400, "CALL_NEXT_REQUIRED");
    }
    if (!queue.counterId && ["recall", "start", "no-show"].includes(action)) {
      throw new AppError("Antrean belum terhubung ke loket.", 409, "COUNTER_NOT_ASSIGNED");
    }

    const assignedCounterId = queue.counterId;
    const counter = assignedCounterId
      ? await (async () => {
          await tx.$queryRaw<Array<{ id: string }>>(
            Prisma.sql`SELECT id FROM Counter WHERE id = ${assignedCounterId} FOR UPDATE`,
          );
          return tx.counter.findUniqueOrThrow({ where: { id: assignedCounterId } });
        })()
      : null;
    if (
      counter &&
      ["CALLED", "SERVING"].includes(queue.status) &&
      counter.activeQueueId !== queue.id
    ) {
      throw new AppError("Status loket tidak konsisten dengan antrean.", 409, "COUNTER_QUEUE_MISMATCH");
    }

    const nextStatus: QueueStatus = statusAfterAction(action, queue.status);
    const now = new Date();
    const service = await tx.service.findUniqueOrThrow({
      where: { id: queue.serviceId },
      select: { name: true },
    });
    const releasesCounter = [
      "complete",
      "skip",
      "no-show",
      "return-to-waiting",
      "cancel",
    ].includes(action);
    if (releasesCounter && queue.counterId) {
      await tx.counter.updateMany({
        where: { id: queue.counterId, activeQueueId: queue.id },
        data: { activeQueueId: null },
      });
    }

    await tx.queue.update({
      where: { id: queue.id },
      data: {
        status: nextStatus,
        ...(action === "start" ? { startedAt: now } : {}),
        ...(action === "complete" ? { completedAt: now } : {}),
        ...(action === "return-to-waiting" ? { counterId: null, calledAt: null } : {}),
        version: { increment: 1 },
      },
    });
    await tx.queueHistory.create({
      data: {
        queueId: queue.id,
        actorUserId: context.userId,
        counterId: queue.counterId,
        fromStatus: queue.status,
        toStatus: nextStatus,
        action: action.replaceAll("-", "_").toUpperCase(),
      },
    });
    await tx.auditLog.create({
      data: {
        businessId: context.businessId,
        actorUserId: context.userId,
        branchId: queue.branchId,
        action: `QUEUE_${action.replaceAll("-", "_").toUpperCase()}`,
        targetType: "Queue",
        targetId: queue.id,
      },
    });
    await tx.outboxEvent.create({
      data: {
        businessId: context.businessId,
        branchId: queue.branchId,
        eventType: `queue.${action}`,
        aggregateId: queue.id,
        payload: {
          queueId: queue.id,
          ticketNumber: queue.ticketNumber,
          status: nextStatus,
          counterId: queue.counterId,
          counterName: counter?.name ?? null,
          serviceName: service.name,
        },
      },
    });

    return { id: queue.id, status: nextStatus };
  });
}
