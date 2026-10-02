import { MembershipRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/modules/shared/errors";

export type BusinessContext = {
  userId: string;
  businessId: string;
  businessSlug: string;
  role: MembershipRole;
  branchIds: string[] | null;
};

export async function requireBusinessContext(
  businessSlug: string,
  branchId?: string,
): Promise<BusinessContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Silakan masuk untuk melanjutkan.", 401, "UNAUTHENTICATED");
  }

  const activeUser = await prisma.user.findFirst({
    where: { id: session.user.id, active: true },
    select: { id: true },
  });
  if (!activeUser) {
    throw new AppError("Akun sudah tidak aktif.", 401, "UNAUTHENTICATED");
  }

  const membership = await prisma.businessMembership.findFirst({
    where: {
      userId: session.user.id,
      business: { slug: businessSlug, active: true },
    },
    include: {
      business: { select: { id: true, slug: true } },
      branchScopes: { select: { branchId: true } },
    },
  });

  if (!membership) {
    throw new AppError("Akses ke bisnis ini tidak diizinkan.", 403, "FORBIDDEN");
  }

  const branchIds =
    membership.role === "OWNER" || membership.role === "SUPER_ADMIN"
      ? null
      : membership.branchScopes.map((scope) => scope.branchId);

  if (branchId) {
    const multiBranch = await prisma.featureConfiguration.findUnique({
      where: {
        businessId_featureKey: {
          businessId: membership.business.id,
          featureKey: "MULTI_BRANCH",
        },
      },
      select: { enabled: true },
    });
    const defaultBranch = !multiBranch?.enabled
      ? await prisma.branch.findFirst({
          where: { businessId: membership.business.id, active: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true },
        })
      : null;
    if (defaultBranch && defaultBranch.id !== branchId) {
      throw new AppError("Fitur multi cabang belum aktif.", 404, "BRANCH_NOT_FOUND");
    }
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId: membership.business.id,
        active: true,
        ...(branchIds ? { id: { in: branchIds } } : {}),
      },
      select: { id: true },
    });
    if (!branch) {
      throw new AppError("Cabang tidak ditemukan.", 404, "BRANCH_NOT_FOUND");
    }
  }

  return {
    userId: session.user.id,
    businessId: membership.business.id,
    businessSlug: membership.business.slug,
    role: membership.role,
    branchIds,
  };
}

export function requireRole(
  context: BusinessContext,
  roles: MembershipRole[],
) {
  if (!roles.includes(context.role)) {
    throw new AppError("Anda tidak memiliki izin untuk tindakan ini.", 403, "FORBIDDEN");
  }
}
