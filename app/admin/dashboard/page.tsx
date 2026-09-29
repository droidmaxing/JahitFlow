import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  ClipboardList,
  Clock3,
  Plus,
  Scissors,
  Wallet,
} from "lucide-react";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Ringkasan" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [orders, payments, activeOrderCount, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { id: true, total: true, payments: { select: { amount: true } } },
    }),
    prisma.paymentLog.findMany({
      where: { paidAt: { gte: monthStart } },
      select: { amount: true },
    }),
    prisma.order.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        customer: { select: { name: true } },
        items: { select: { totalPcs: true } },
        payments: { select: { amount: true } },
      },
    }),
  ]);

  const outstanding = orders.reduce((sum, order) => {
    const paid = order.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );
    return sum + Math.max(0, Number(order.total) - paid);
  }, 0);
  const monthlyRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const stats = [
    {
      label: "Pembayaran bulan ini",
      value: formatCurrency(monthlyRevenue),
      note: "Pembayaran masuk sejak awal bulan",
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-700",
      trend: "Omzet kas",
    },
    {
      label: "Piutang berjalan",
      value: formatCurrency(outstanding),
      note: "Sisa pembayaran pesanan aktif",
      icon: Wallet,
      color: "bg-amber-50 text-amber-700",
      trend: "Belum tertagih",
    },
    {
      label: "Order aktif",
      value: String(activeOrderCount),
      note: "Sedang diproses di workshop",
      icon: Scissors,
      color: "bg-blue-50 text-primary",
      trend: "Produksi",
    },
    {
      label: "Total pesanan",
      value: String(recentOrders.length ? orders.length : 0),
      note: "Pesanan tercatat selain batal",
      icon: ClipboardList,
      color: "bg-violet-50 text-violet-700",
      trend: "Semua waktu",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">DASHBOARD</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Selamat bekerja, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Berikut ringkasan aktivitas workshop hari ini.
          </p>
        </div>
        <Button asChild className="no-print h-10 w-fit">
          <Link href="/admin/orders/new">
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Buat pesanan
          </Link>
        </Button>
      </div>

      <section aria-label="Ringkasan usaha" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, color, trend }) => (
          <Card key={label} className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {label === "Piutang berjalan" ? (
                    <ArrowDownRight aria-hidden="true" className="size-3 text-amber-600" />
                  ) : (
                    <ArrowUpRight aria-hidden="true" className="size-3 text-emerald-600" />
                  )}
                  {trend}
                </span>
              </div>
              <p className="mt-5 text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {value}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">Pesanan terbaru</h2>
              <p className="mt-1 text-xs text-slate-500">Aktivitas order terakhir</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              Semua pesanan <ArrowRight aria-hidden="true" className="ml-1 inline size-4" />
            </Link>
          </div>
          {recentOrders.length ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const pcs = order.items.reduce(
                  (sum, item) => sum + item.totalPcs,
                  0,
                );
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Scissors aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {order.customer.name}
                        </span>
                        <span className="mt-1 block font-mono text-xs text-slate-500">
                          {order.orderNumber} · {pcs} pcs
                        </span>
                      </span>
                    </div>
                    <span className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                      <StatusBadge status={order.status} />
                      <PaymentBadge status={order.paymentStatus} />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <ClipboardList aria-hidden="true" className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-800">Belum ada pesanan</p>
              <p className="mt-1 text-sm text-slate-500">
                Pesanan baru akan muncul di sini.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/admin/orders/new">Buat pesanan pertama</Link>
              </Button>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-950">Jadwal workshop</h2>
            <p className="mt-1 text-xs text-slate-500">Pesanan dengan tenggat terdekat</p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            {recentOrders
              .filter((order) => order.dueDate && order.status !== "COMPLETED" && order.status !== "CANCELLED")
              .slice(0, 4)
              .map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock3 aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {order.customer.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {order.orderNumber}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                    {formatDate(order.dueDate)}
                  </span>
                </Link>
              ))}
            {!recentOrders.some(
              (order) => order.dueDate && order.status !== "COMPLETED" && order.status !== "CANCELLED",
            ) ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada jadwal produksi.
              </p>
            ) : null}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-6">
            Pembayaran terbarukan{" "}
            {payments.length
              ? formatDateTime(now)
              : "belum ada pembayaran bulan ini"}
          </div>
        </Card>
      </div>
    </div>
  );
}
