import { Badge } from "@/components/ui/badge";
import type { PaymentStatus, ProductionStatus } from "@prisma/client";
import { statusLabels } from "@/lib/order-status";

const productionColors: Record<ProductionStatus, string> = {
  WAITING: "border-amber-200 bg-amber-50 text-amber-800",
  CUTTING: "border-orange-200 bg-orange-50 text-orange-800",
  PRINTING_EMBROIDERY: "border-violet-200 bg-violet-50 text-violet-800",
  SEWING: "border-blue-200 bg-blue-50 text-blue-800",
  QC_PACKING: "border-cyan-200 bg-cyan-50 text-cyan-800",
  READY_FOR_PICKUP: "border-emerald-200 bg-emerald-50 text-emerald-800",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: "Belum bayar",
  DP_PAID: "DP dibayar",
  FULLY_PAID: "Lunas",
};

const paymentColors: Record<PaymentStatus, string> = {
  UNPAID: "border-rose-200 bg-rose-50 text-rose-800",
  DP_PAID: "border-amber-200 bg-amber-50 text-amber-800",
  FULLY_PAID: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status }: { status: ProductionStatus }) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${productionColors[status]}`}
    >
      {statusLabels[status]}
    </Badge>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${paymentColors[status]}`}
    >
      {paymentLabels[status]}
    </Badge>
  );
}
