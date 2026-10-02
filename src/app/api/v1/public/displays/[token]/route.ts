import { errorResponse } from "@/modules/shared/errors";
import { getDisplaySnapshot } from "@/modules/display/display-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const data = await getDisplaySnapshot(token, request);
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
