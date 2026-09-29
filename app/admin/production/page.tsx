import type { Metadata } from "next";
import { KanbanBoard } from "@/components/production/kanban-board";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Papan produksi" };
export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const orders = await prisma.order.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      orderNumber: true,
      status: true,
      dueDate: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: { select: { name: true, totalPcs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">LANTAI PRODUKSI</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Papan produksi
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Seret pesanan ke tahap berikutnya untuk memperbarui progres workshop.
        </p>
      </div>
      {orders.length ? (
        <KanbanBoard orders={orders} />
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <p className="font-semibold text-slate-800">Belum ada pesanan di papan produksi</p>
          <p className="mt-2 text-sm text-slate-500">
            Pesanan yang dibuat akan muncul di kolom Menunggu.
          </p>
        </div>
      )}
    </div>
  );
}
