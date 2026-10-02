import { QueueStatus } from "@prisma/client";
import { AppError } from "@/modules/shared/errors";

export type QueueAction =
  | "call"
  | "recall"
  | "start"
  | "complete"
  | "skip"
  | "no-show"
  | "return-to-waiting"
  | "cancel";

const transitions: Record<QueueAction, QueueStatus[]> = {
  call: ["WAITING"],
  recall: ["CALLED"],
  start: ["CALLED"],
  complete: ["SERVING"],
  skip: ["WAITING", "CALLED"],
  "no-show": ["CALLED"],
  "return-to-waiting": ["CALLED"],
  cancel: ["WAITING", "CALLED"],
};

export function assertQueueTransition(
  action: QueueAction,
  currentStatus: QueueStatus,
) {
  if (!transitions[action].includes(currentStatus)) {
    throw new AppError(
      `Aksi ${action} tidak dapat dilakukan pada antrean berstatus ${currentStatus}.`,
      409,
      "INVALID_QUEUE_TRANSITION",
    );
  }
}

export function statusAfterAction(
  action: QueueAction,
  currentStatus: QueueStatus,
): QueueStatus {
  assertQueueTransition(action, currentStatus);
  switch (action) {
    case "call":
      return "CALLED";
    case "start":
      return "SERVING";
    case "complete":
      return "COMPLETED";
    case "skip":
      return "SKIPPED";
    case "no-show":
      return "NO_SHOW";
    case "cancel":
      return "CANCELLED";
    case "return-to-waiting":
      return "WAITING";
    case "recall":
      return "CALLED";
  }
}
