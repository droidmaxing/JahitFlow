import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Package,
  Phone,
  UserRound,
} from "lucide-react";
import { ProductionStatus } from "@prisma/client";
import { PaymentForm } from "@/components/orders/payment-form";
import { PrintActions } from "@/components/orders/print-actions";
import { InvoicePrintView } from "@/components/orders/invoice-print-view";
import { SpkPrintView } from "@/components/orders/spk-print-view";
import { SignaturePadModal } from "@/components/orders/signature-pad-modal";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Detail pesanan" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { sizes: { orderBy: { size: "asc" } } } },
      payments: { orderBy: { paidAt: "desc" } },
      statusLogs: {
        orderBy: { changedAt: "desc" },
      },
    },
  });
  if (!order) notFound();

  const paid = order.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const outstanding = Math.max(0, Number(order.total) - paid);
  const canHandover =
    order.status === ProductionStatus.READY_FOR_PICKUP && outstanding === 0;

  return (
    <div className="order-detail-page space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/orders"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke pesanan
        </Link>
        <PrintActions orderNumber={order.orderNumber} />
      </div>

      <section className="no-print flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-950">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Dibuat {formatDateTime(order.createdAt)} · oleh {order.createdByName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canHandover ? <SignaturePadModal orderId={order.id} /> : null}
          {order.status === ProductionStatus.READY_FOR_PICKUP && outstanding > 0 ? (
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Catat pelunasan sebelum serah terima
            </span>
          ) : null}
        </div>
      </section>

      <div className="no-print grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound aria-hidden="true" className="size-4 text-primary" />
                Informasi pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Nama" value={order.customerName} />
              <Info
                label="Nomor WhatsApp"
                value={order.customerPhone}
                icon={<Phone aria-hidden="true" className="size-3.5" />}
              />
              <Info label="Email" value={order.customerEmail || "—"} />
              <Info label="Alamat" value={order.customerAddress || "—"} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package aria-hidden="true" className="size-4 text-primary" />
                Rincian produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-950">{item.name}</h2>
                      {item.material ? (
                        <p className="mt-1 text-xs text-slate-500">{item.material}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                      ) : null}
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.totalPcs} pcs
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {item.sizes.map((size) => (
                      <div key={size.id} className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                        <p className="text-[11px] text-slate-500">{size.size}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {size.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
                    <span className="text-slate-600">
                      {formatCurrency(item.pricePerPiece.toString())} / pcs
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.subtotal.toString())}
                    </span>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 aria-hidden="true" className="size-4 text-primary" />
                Riwayat status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.statusLogs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {log.toStatus.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.note || "Status diperbarui"} · {log.changedByName} ·{" "}
                      {formatDateTime(log.changedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays aria-hidden="true" className="size-4 text-primary" />
                Jadwal & catatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Info label="Estimasi selesai" value={formatDate(order.dueDate)} />
              <Info label="Catatan produksi" value={order.notes || "Tidak ada catatan."} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard aria-hidden="true" className="size-4 text-primary" />
                Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {payment.note || payment.method}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(payment.paidAt)} · Dicatat oleh{" "}
                        {payment.recordedByName}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold">
                      {formatCurrency(payment.amount.toString())}
                    </p>
                  </div>
                ))}
                {!order.payments.length ? (
                  <p className="text-sm text-slate-500">Belum ada pembayaran.</p>
                ) : null}
              </div>
              <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-4 text-sm">
                <MoneyRow label="Subtotal" value={formatCurrency(order.subtotal.toString())} />
                <MoneyRow label="Diskon" value={`− ${formatCurrency(order.discount.toString())}`} />
                <MoneyRow label="Total" value={formatCurrency(order.total.toString())} strong />
                <MoneyRow label="Sudah dibayar" value={formatCurrency(paid)} />
                <MoneyRow label="Sisa tagihan" value={formatCurrency(outstanding)} strong />
              </div>
              {outstanding > 0 ? (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Catat pembayaran</h3>
                  <PaymentForm orderId={order.id} outstanding={outstanding} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="print-preview">
        <InvoicePrintView
          order={{
            ...order,
            customer: {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.customerAddress,
            },
          }}
        />
        <SpkPrintView
          order={{
            ...order,
            customer: { name: order.customerName, phone: order.customerPhone },
          }}
        />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900">
        {icon}
        {value}
      </p>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
