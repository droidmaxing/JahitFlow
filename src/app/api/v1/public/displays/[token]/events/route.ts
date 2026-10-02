import { errorResponse } from "@/modules/shared/errors";
import { getDisplayEventStream } from "@/modules/display/display-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const after = new URL(request.url).searchParams.get("after") ?? "";
    return await getDisplayEventStream(token, request, after);
  } catch (error) {
    return errorResponse(error);
  }
}
