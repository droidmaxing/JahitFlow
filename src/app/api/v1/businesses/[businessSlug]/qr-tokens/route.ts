import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/modules/shared/errors";
import { requireFeature } from "@/modules/feature/feature-gate";
import { hashAccessToken } from "@/modules/queue/application/public-queue";
import { requireBusinessContext, requireRole } from "@/modules/tenancy/context";

type RouteContext = { params: Promise<{ businessSlug: string }> };

const createSchema = z.object({ branchId: z.string().min(1) });

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("Cabang QR tidak valid.", 400, "INVALID_INPUT");
    }
    const context = await requireBusinessContext(businessSlug, parsed.data.branchId);
    requireRole(context, ["SUPER_ADMIN"]);
    await requireFeature(context.businessId, "QR_QUEUE");

    const token = randomBytes(32).toString("base64url");
    const created = await prisma.$transaction(async (tx) => {
      const access = await tx.accessToken.create({
        data: {
          businessId: context.businessId,
          branchId: parsed.data.branchId,
          tokenHash: hashAccessToken(token),
          type: "QR_QUEUE",
        },
        select: { id: true, branchId: true, createdAt: true },
      });
      await tx.auditLog.create({
        data: {
          businessId: context.businessId,
          actorUserId: context.userId,
          branchId: parsed.data.branchId,
          action: "QR_TOKEN_CREATED",
          targetType: "AccessToken",
          targetId: access.id,
        },
      });
      return access;
    });
    return Response.json(
      { data: { ...created, url: `/q/${token}` } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
