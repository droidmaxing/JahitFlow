import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/modules/shared/errors";
import { requireBusinessContext, requireRole } from "@/modules/tenancy/context";
import { createDisplay } from "@/modules/display/display-service";

type RouteContext = { params: Promise<{ businessSlug: string }> };

const createSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
});

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const context = await requireBusinessContext(businessSlug);
    requireRole(context, ["SUPER_ADMIN"]);
    const displays = await prisma.display.findMany({
      where: {
        businessId: context.businessId,
        ...(context.branchIds ? { branchId: { in: context.branchIds } } : {}),
      },
      select: { id: true, branchId: true, name: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: displays });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("Data display tidak valid.", 400, "INVALID_INPUT");
    }
    const context = await requireBusinessContext(businessSlug, parsed.data.branchId);
    const display = await createDisplay(context, parsed.data.branchId, parsed.data.name);
    return Response.json({ data: display }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
