import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJsonRequest } from "@/modules/shared/errors";
import { validationAppError } from "@/modules/shared/validation-error";
import { requireFeature } from "@/modules/feature/feature-gate";
import { hashAccessToken } from "@/modules/queue/application/public-queue";
import { requireBusinessContext, requireRole } from "@/modules/tenancy/context";

type RouteContext = { params: Promise<{ businessSlug: string }> };
const schema = z.object({ branchId: z.string().min(1) });

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const parsed = schema.safeParse(await readJsonRequest(request));
    if (!parsed.success) {
      throw validationAppError(parsed.error, "Pilih cabang untuk membuat tautan booking.", {
        branchId: "Cabang",
      });
    }
    const context = await requireBusinessContext(businessSlug, parsed.data.branchId);
    requireRole(context, ["SUPER_ADMIN"]);
    await requireFeature(context.businessId, "BOOKING");

    const token = randomBytes(32).toString("base64url");
    const access = await prisma.$transaction(async (tx) => {
      const created = await tx.accessToken.create({
        data: {
          businessId: context.businessId,
          branchId: parsed.data.branchId,
          tokenHash: hashAccessToken(token),
          type: "BOOKING",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        select: { id: true, branchId: true, createdAt: true },
      });
      await tx.auditLog.create({
        data: {
          businessId: context.businessId,
          actorUserId: context.userId,
          branchId: parsed.data.branchId,
          action: "BOOKING_TOKEN_CREATED",
          targetType: "AccessToken",
          targetId: created.id,
        },
      });
      return created;
    });
    return Response.json(
      { data: { ...access, url: `/book/${token}` } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
