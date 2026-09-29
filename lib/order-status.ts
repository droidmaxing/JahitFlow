import { ProductionStatus } from "@prisma/client";

export const productionStatuses: ProductionStatus[] = [
  "WAITING",
  "CUTTING",
  "PRINTING_EMBROIDERY",
  "SEWING",
  "QC_PACKING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

export const statusLabels: Record<ProductionStatus, string> = {
  WAITING: "Menunggu",
  CUTTING: "Potong bahan",
  PRINTING_EMBROIDERY: "Sablon / bordir",
  SEWING: "Jahit",
  QC_PACKING: "QC & packing",
  READY_FOR_PICKUP: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const statusDescriptions: Record<ProductionStatus, string> = {
  WAITING: "Pesanan diterima dan menunggu produksi.",
  CUTTING: "Bahan sedang dipotong sesuai ukuran.",
  PRINTING_EMBROIDERY: "Desain sedang disablon atau dibordir.",
  SEWING: "Potongan bahan sedang dijahit.",
  QC_PACKING: "Produk diperiksa kualitasnya dan dikemas.",
  READY_FOR_PICKUP: "Pesanan selesai dan siap diambil.",
  COMPLETED: "Pesanan telah diserahterimakan.",
  CANCELLED: "Pesanan dibatalkan.",
};

const allowedTransitions: Record<ProductionStatus, ProductionStatus[]> = {
  WAITING: ["CUTTING", "CANCELLED"],
  CUTTING: ["PRINTING_EMBROIDERY", "SEWING", "CANCELLED"],
  PRINTING_EMBROIDERY: ["SEWING", "CANCELLED"],
  SEWING: ["QC_PACKING", "CANCELLED"],
  QC_PACKING: ["SEWING", "READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["SEWING", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionStatus(
  from: ProductionStatus,
  to: ProductionStatus,
) {
  return allowedTransitions[from].includes(to);
}
