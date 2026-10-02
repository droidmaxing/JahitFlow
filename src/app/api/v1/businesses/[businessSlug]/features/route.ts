import { FeatureKey } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse, readJsonRequest } from "@/modules/shared/errors";
import { validationAppError } from "@/modules/shared/validation-error";
import { requireBusinessContext, requireRole } from "@/modules/tenancy/context";

type RouteContext = { params: Promise<{ businessSlug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const context = await requireBusinessContext(businessSlug);
    const features = await prisma.featureConfiguration.findMany({
      where: { businessId: context.businessId },
      orderBy: { featureKey: "asc" },
    });
    return Response.json({ data: features });
  } catch (error) {
    return errorResponse(error);
  }
}

const updateSchema = z.object({
  features: z
    .array(
      z.object({
        featureKey: z.enum(FeatureKey),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(Object.keys(FeatureKey).length),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const parsed = updateSchema.safeParse(await readJsonRequest(request));
    if (!parsed.success) {
      throw validationAppError(parsed.error, "Periksa kembali perubahan fitur.", {
        features: "Daftar fitur",
      });
    }
    const context = await requireBusinessContext(businessSlug);
    requireRole(context, ["SUPER_ADMIN"]);

    const keys = parsed.data.features.map((feature) => feature.featureKey);
    if (new Set(keys).size !== keys.length) {
      throw new AppError("Daftar fitur berisi duplikasi.", 400, "DUPLICATE_FEATURE");
    }

    if (
      parsed.data.features.some(
        (feature) => feature.featureKey === FeatureKey.MULTI_BRANCH && !feature.enabled,
      )
    ) {
      const activeBranches = await prisma.branch.count({
        where: { businessId: context.businessId, active: true },
      });
      if (activeBranches > 1) {
        throw new AppError(
          "Pindahkan operasional ke satu cabang sebelum menonaktifkan Multi Branch.",
          409,
          "MULTI_BRANCH_IN_USE",
        );
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const updated = [];
      for (const { featureKey, enabled } of parsed.data.features) {
        updated.push(
          await tx.featureConfiguration.upsert({
            where: {
              businessId_featureKey: {
                businessId: context.businessId,
                featureKey,
              },
            },
            update: { enabled },
            create: { businessId: context.businessId, featureKey, enabled },
          }),
        );
      }
      await tx.auditLog.createMany({
        data: parsed.data.features.map(({ featureKey, enabled }) => ({
          businessId: context.businessId,
          actorUserId: context.userId,
          action: "FEATURE_UPDATED",
          targetType: "FeatureConfiguration",
          targetId: featureKey,
          metadata: { featureKey, enabled },
        })),
      });
      return updated;
    });
    return Response.json({ data: results });
  } catch (error) {
    return errorResponse(error);
  }
}
