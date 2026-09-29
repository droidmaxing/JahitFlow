import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Package, Scissors } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { statusLabels } from "@/lib/order-status";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
} from "@/lib/utils";
import { OrderTimeline } from "@/components/tracking/order-timeline";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ phone?: string }>;
};

export default async function PublicOrderTrackingPage({
  params,
  searchParams,
}: PageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const phoneSuffix = query.phone?.replace(/\D/g, "");
  if (!phoneSuffix || phoneSuffix.length !== 4) notFound();
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderId.toUpperCase(),
      customer: { phone: { endsWith: phoneSuffix } },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      items: { include: { sizes: { orderBy: { size: "asc" } } } },
      payments: {
        orderBy: { paidAt: "asc" },
        select: { id: true, amount: true, method: true, paidAt: true },
      },
      statusLogs: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!order) notFound();

  const paid = order.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappText = encodeURIComponent(
    `Halo, saya ingin bertanya tentang pesanan ${order.orderNumber}.`,
  );
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
              <Scissors aria-hidden="true" className="size-4" />
            </span>
            <span className="font-bold text-slate-900">
              jahit<span className="text-primary">flow</span>
            </span>
          </Link>
          <Link
            href="/track"
            className="text-sm font-medium text-slate-600 hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="mr-1 inline size-4" />
            Cari pesanan lain
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Detail pelacakan
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Pesanan untuk {order.customer.name.split(" ")[0]} · dibuat{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Progres produksi</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <OrderTimeline status={order.status} logs={order.statusLogs} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package aria-hidden="true" className="size-4 text-primary" />
                  Rincian pesanan
                </CardTitle>
                {order.dueDate ? (
                  <p className="text-sm text-muted-foreground">
                    Estimasi selesai: {formatDate(order.dueDate)}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {item.material ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.material}
                          </p>
                        ) : null}
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {item.totalPcs} pcs
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.sizes.map((size) => (
                        <span
                          key={size.id}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {size.size}{" "}
                          <strong className="text-slate-900">
                            × {size.quantity}
                          </strong>
                        </span>
                      ))}
                    </div>
                    {item.description ? (
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  Pembayaran
                  <PaymentBadge status={order.paymentStatus} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {payment.method}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(payment.paidAt)}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount.toString())}
                      </p>
                    </div>
                  ))}
                  {order.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada pembayaran tercatat.
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Total pesanan</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(order.total.toString())}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Sudah dibayar</span>
                    <span className="font-medium text-emerald-700">
                      {formatCurrency(paid)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-3 font-semibold text-slate-900">
                    <span>Sisa pembayaran</span>
                    <span>
                      {formatCurrency(Math.max(0, Number(order.total) - paid))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-100 bg-emerald-50/60 shadow-sm">
              <CardContent className="p-5">
                <h2 className="font-semibold text-slate-900">Butuh bantuan?</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Hubungi admin konveksi untuk pertanyaan seputar pesanan.
                  Nomor pelanggan: {formatPhone(order.customer.phone)}.
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Tanya lewat WhatsApp
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  Status terakhir: {statusLabels[order.status]}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
