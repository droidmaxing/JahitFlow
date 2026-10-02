import { z } from "zod";
import { AppError, errorResponse } from "@/modules/shared/errors";
import { requireFeature } from "@/modules/feature/feature-gate";
import { listBranchBookings } from "@/modules/booking/application/booking-service";
import { requireBusinessContext } from "@/modules/tenancy/context";

type RouteContext = { params: Promise<{ businessSlug: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug } = await params;
    const query = new URL(request.url).searchParams;
    const input = z
      .object({
        branchId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .safeParse({
        branchId: query.get("branchId"),
        date: query.get("date"),
      });
    if (!input.success) {
      throw new AppError("Cabang dan tanggal wajib dipilih.", 400, "INVALID_INPUT");
    }
    const context = await requireBusinessContext(businessSlug, input.data.branchId);
    await requireFeature(context.businessId, "BOOKING");
    const data = await listBranchBookings(context, input.data.branchId, input.data.date);
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
