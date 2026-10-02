import { z } from "zod";
import { errorResponse, readJsonRequest } from "@/modules/shared/errors";
import { validationAppError } from "@/modules/shared/validation-error";
import { requireBusinessContext } from "@/modules/tenancy/context";
import { transitionQueue } from "@/modules/queue/application/queue-service";

const actionSchema = z.object({
  action: z.enum([
    "recall",
    "start",
    "complete",
    "skip",
    "no-show",
    "return-to-waiting",
    "cancel",
  ]),
});

type RouteContext = {
  params: Promise<{ businessSlug: string; queueId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { businessSlug, queueId } = await params;
    const parsed = actionSchema.safeParse(await readJsonRequest(request));
    if (!parsed.success) {
      throw validationAppError(parsed.error, "Pilih aksi antrean yang tersedia.", {
        action: "Aksi antrean",
      });
    }

    const context = await requireBusinessContext(businessSlug);
    const result = await transitionQueue(context, queueId, parsed.data.action);
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
