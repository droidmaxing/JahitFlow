import { z } from "zod";
import { errorResponse, AppError } from "@/modules/shared/errors";
import {
  getQrConfiguration,
  issuePublicQueue,
} from "@/modules/queue/application/public-queue";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const config = await getQrConfiguration(token, request);
    return Response.json({ data: config }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

const issueSchema = z.object({
  serviceId: z.string().min(1).max(64),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(24).optional(),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const parsed = issueSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("Data pengambilan nomor tidak valid.", 400, "INVALID_INPUT");
    }
    const result = await issuePublicQueue(token, request, parsed.data);
    return Response.json(
      {
        data: {
          ticketNumber: result.queue.ticketNumber,
          status: result.queue.status,
          issuedAt: result.queue.issuedAt,
          estimateMinutes: result.estimateMinutes,
          statusUrl: `/q/status/${result.receiptToken}`,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
