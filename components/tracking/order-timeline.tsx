import { Check, Circle, Clock3 } from "lucide-react";
import { ProductionStatus } from "@prisma/client";
import { statusDescriptions, statusLabels } from "@/lib/order-status";
import { formatDateTime } from "@/lib/utils";

const progressOrder: ProductionStatus[] = [
  "WAITING",
  "CUTTING",
  "PRINTING_EMBROIDERY",
  "SEWING",
  "QC_PACKING",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

type TimelineLog = {
  fromStatus: ProductionStatus | null;
  toStatus: ProductionStatus;
  note: string | null;
  changedAt: Date;
};

export function OrderTimeline({
  status,
  logs,
}: {
  status: ProductionStatus;
  logs: TimelineLog[];
}) {
  if (status === "CANCELLED") {
    const latestLog = logs.at(-1);
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
        <p className="font-semibold">Pesanan dibatalkan</p>
        <p className="mt-1 text-sm">{statusDescriptions.CANCELLED}</p>
        {latestLog ? (
          <p className="mt-3 text-xs">Diperbarui {formatDateTime(latestLog.changedAt)}</p>
        ) : null}
      </div>
    );
  }

  const currentIndex = progressOrder.indexOf(status);

  return (
    <ol className="space-y-0">
      {progressOrder.map((step, index) => {
        const latestLog = [...logs].reverse().find((log) => log.toStatus === step);
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {index < progressOrder.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${
                  isComplete ? "bg-primary" : "bg-border"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${
                isComplete
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCurrent
                    ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <Check aria-hidden="true" className="size-4" />
              ) : isCurrent ? (
                <Clock3 aria-hidden="true" className="size-4" />
              ) : (
                <Circle aria-hidden="true" className="size-3" />
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={`text-sm font-semibold ${
                  isCurrent
                    ? "text-primary"
                    : isComplete
                      ? ""
                      : "text-muted-foreground"
                }`}
              >
                {statusLabels[step]}
                {isCurrent ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Sedang berlangsung
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {latestLog?.note || statusDescriptions[step]}
              </p>
              {latestLog ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatDateTime(latestLog.changedAt)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
