"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { CalendarDays, GripVertical, LoaderCircle, Scissors } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/status";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { productionStatuses, statusLabels } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import type { ProductionStatus } from "@prisma/client";

export type ProductionCard = {
  id: string;
  orderNumber: string;
  status: ProductionStatus;
  dueDate: Date | null;
  customer: { name: string };
  items: { name: string; totalPcs: number }[];
};

export function KanbanBoard({ orders }: { orders: ProductionCard[] }) {
  const router = useRouter();
  const [movingOrder, setMovingOrder] = useState<string | null>(null);

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) {
      return;
    }
    const orderId = result.draggableId;
    const nextStatus = result.destination.droppableId as ProductionStatus;
    setMovingOrder(orderId);
    try {
      const response = await updateOrderStatus(orderId, nextStatus);
      if (!response.success) {
        toast.error(response.error ?? "Status pesanan tidak dapat diperbarui.");
        return;
      }
      toast.success(`Status dipindahkan ke ${statusLabels[nextStatus]}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status gagal diperbarui.");
    } finally {
      setMovingOrder(null);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid min-h-[540px] auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
        {productionStatuses.map((status) => {
          const columnOrders = orders.filter((order) => order.status === status);
          return (
            <section key={status} aria-label={`${statusLabels[status]}: ${columnOrders.length} pesanan`} className="flex min-h-[520px] flex-col rounded-2xl bg-slate-100/80 p-3">
              <header className="flex items-center justify-between gap-2 px-1 pb-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${status === "COMPLETED" ? "bg-emerald-500" : status === "CANCELLED" ? "bg-rose-500" : "bg-blue-500"}`} />
                  <h2 className="text-xs font-bold text-slate-800">
                    {statusLabels[status]}
                  </h2>
                </div>
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-600">
                  {columnOrders.length}
                </span>
              </header>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-1 flex-col gap-2.5 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? "bg-blue-100/70" : ""
                    }`}
                  >
                    {columnOrders.map((order, index) => (
                      <Draggable
                        key={order.id}
                        draggableId={order.id}
                        index={index}
                        isDragDisabled={movingOrder === order.id || status === "COMPLETED" || status === "CANCELLED"}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <Card
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`rounded-xl border-slate-200 bg-white shadow-sm transition-shadow ${
                              dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                            }`}
                          >
                            <CardContent className="p-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="font-mono text-xs font-semibold text-primary hover:underline"
                                >
                                  {order.orderNumber}
                                </Link>
                                <button
                                  type="button"
                                  aria-label={`Pindahkan pesanan ${order.orderNumber}`}
                                  title="Seret untuk mengubah status"
                                  {...dragProvided.dragHandleProps}
                                  className="flex size-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  {movingOrder === order.id ? (
                                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                                  ) : (
                                    <GripVertical aria-hidden="true" className="size-4" />
                                  )}
                                </button>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {order.customer.name}
                              </p>
                              <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                                {order.items.map((item, itemIndex) => (
                                  <div key={`${item.name}-${itemIndex}`} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-slate-600">{item.name}</span>
                                    <span className="shrink-0 font-semibold text-slate-800">{item.totalPcs} pcs</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                {order.dueDate ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                    <CalendarDays aria-hidden="true" className="size-3.5" />
                                    {formatDate(order.dueDate)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Tanpa tenggat</span>
                                )}
                                <StatusBadge status={status} />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!columnOrders.length ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center">
                        <Scissors aria-hidden="true" className="size-5 text-slate-300" />
                        <p className="mt-2 text-xs text-slate-500">Lepas pesanan di sini</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
