import { errorResponse } from "@/modules/shared/errors";
import { getPublicQueueStatus } from "@/modules/queue/application/public-queue";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const data = await getPublicQueueStatus(token, request);
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
