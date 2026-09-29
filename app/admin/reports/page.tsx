import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportPeriod } from "@/lib/report-period";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan bisnis" };
export const dynamic = "force-dynamic";

type ReportSearchParams = {
  from?: string;
  to?: string;
};

function remainingBalance(total: number, paid: number) {
  return Math.max(0, total - paid);
}

export default async function OwnerReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const user = await requireUser();
  if (user.role !== Role.OWNER) redirect("/admin/dashboard");

  const params = await searchParams;
  const period = getReportPeriod(params.from, params.to);
  const { from, to, hasInvalidRange, startDate, endDate, currentDate } = period;

  const [
    periodOrders,
    periodPayments,
    openOrders,
    productionOrders,
    recentPayments,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        status: { not: "CANCELLED" },
      },
      select: {
        customerId: true,
        orderNumber: true,
        customerName: true,
        total: true,
        items: { select: { totalPcs: true } },
      },
    }),
    prisma.paymentLog.findMany({
      where: { paidAt: { gte: startDate, lt: endDate } },
      select: {
        amount: true,
        method: true,
        paidAt: true,
        order: { select: { orderNumber: true, customerName: true } },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        total: true,
        dueDate: true,
        status: true,
        payments: { select: { amount: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      _count: { _all: true },
    }),
    prisma.paymentLog.findMany({
      orderBy: { paidAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            paymentStatus: true,
          },
        },
      },
    }),
  ]);

  const orderValue = periodOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const producedPieces = periodOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.totalPcs, 0),
    0,
  );
  const collectedPayments = periodPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const outstanding = openOrders.reduce((sum, order) => {
    const paid = order.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );
    return sum + remainingBalance(Number(order.total), paid);
  }, 0);
  const overdueBalance = openOrders.reduce((sum, order) => {
    if (
      !order.dueDate ||
      order.dueDate >= currentDate ||
      order.status === "COMPLETED"
    ) {
      return sum;
    }
    const paid = order.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );
    return sum + remainingBalance(Number(order.total), paid);
  }, 0);
  const overdueCount = openOrders.filter((order) => {
    if (
      !order.dueDate ||
      order.dueDate >= currentDate ||
      order.status === "COMPLETED"
    ) {
      return false;
    }
    const paid = order.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );
    return remainingBalance(Number(order.total), paid) > 0;
  }).length;

  const statusLabels: Record<string, string> = {
    WAITING: "Menunggu",
    CUTTING: "Pemotongan",
    PRINTING_EMBROIDERY: "Sablon / bordir",
    SEWING: "Penjahitan",
    QC_PACKING: "QC & pengemasan",
    READY_FOR_PICKUP: "Siap diambil",
  };
  const customerTotals = new Map<
    string,
    { name: string; count: number; amount: number }
  >();
  for (const order of periodOrders) {
    const current = customerTotals.get(order.customerId) ?? {
      name: order.customerName,
      count: 0,
      amount: 0,
    };
    current.count += 1;
    current.amount += Number(order.total);
    customerTotals.set(order.customerId, current);
  }
  const topCustomers = [...customerTotals.values()]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
  const paymentMethods = periodPayments.reduce((totals, payment) => {
    const method = payment.method.toUpperCase();
    totals.set(method, (totals.get(method) ?? 0) + Number(payment.amount));
    return totals;
  }, new Map<string, number>());
  const stats = [
    {
      label: "Pembayaran diterima",
      value: formatCurrency(collectedPayments),
      note: "Kas masuk pada periode yang dipilih",
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Nilai pesanan baru",
      value: formatCurrency(orderValue),
      note: `${periodOrders.length} pesanan · ${producedPieces.toLocaleString("id-ID")} pcs`,
      icon: ClipboardList,
      color: "bg-blue-50 text-primary",
    },
    {
      label: "Piutang berjalan",
      value: formatCurrency(outstanding),
      note: "Sisa tagihan semua pesanan selain batal",
      icon: Wallet,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Tagihan terlambat",
      value: formatCurrency(overdueBalance),
      note: `${overdueCount} pesanan melewati jatuh tempo`,
      icon: AlertTriangle,
      color: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">KHUSUS OWNER</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Laporan bisnis
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Pantau arus kas, penjualan, piutang, pelanggan, dan beban produksi
            berdasarkan catatan pesanan.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-10 w-fit">
            <a
              href={`/admin/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              download
            >
              <Download aria-hidden="true" className="mr-2 size-4" />
              Ekspor Excel
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 w-fit">
            <Link href="/admin/orders">
              <PackageCheck aria-hidden="true" className="mr-2 size-4" />
              Lihat pesanan
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1.5 text-sm font-medium text-slate-700">
              Dari tanggal
              <input
                type="date"
                name="from"
                required
                defaultValue={from}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="grid flex-1 gap-1.5 text-sm font-medium text-slate-700">
              Sampai tanggal
              <input
                type="date"
                name="to"
                required
                defaultValue={to}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <Button type="submit" className="h-10">
              <CalendarDays aria-hidden="true" className="mr-2 size-4" />
              Terapkan
            </Button>
          </form>
          {hasInvalidRange ? (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              Rentang tanggal tidak valid. Laporan menampilkan periode bulan ini.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section
        aria-label="Indikator utama bisnis"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, note, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <span
                className={`flex size-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-5 text-sm text-slate-500">{label}</p>
              <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950">
                {value}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartNoAxesCombined
                aria-hidden="true"
                className="size-5 text-primary"
              />
              Pesanan dalam produksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productionOrders.length ? (
              productionOrders.map(({ status, _count }) => {
                const totalActive = productionOrders.reduce(
                  (sum, entry) => sum + entry._count._all,
                  0,
                );
                const percentage =
                  totalActive > 0 ? (_count._all / totalActive) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <StatusBadge status={status} />
                      <span className="shrink-0 font-semibold text-slate-700">
                        {_count._all} pesanan
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${statusLabels[status] ?? status}: ${_count._all} pesanan`}
                      aria-valuemin={0}
                      aria-valuemax={totalActive}
                      aria-valuenow={_count._all}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada pesanan yang sedang diproses.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Pelanggan utama pada periode</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-center">Pesanan</TableHead>
                    <TableHead className="text-right">Nilai pesanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.name}>
                      <TableCell className="max-w-48 truncate font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada pesanan pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Pembayaran berdasarkan metode</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.size ? (
              <div className="space-y-3">
                {[...paymentMethods.entries()].map(([method, amount]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {method === "CASH"
                        ? "Tunai"
                        : method === "TRANSFER"
                          ? "Transfer"
                          : method === "QRIS"
                            ? "QRIS"
                            : method}
                    </span>
                    <span className="text-sm font-semibold text-slate-950">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada pembayaran pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Pembayaran terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pesanan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs text-slate-600">
                        {formatDateTime(payment.paidAt)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(payment.order.orderNumber)}`}
                          className="font-medium text-primary hover:underline"
                        >
                          <span className="block">{payment.order.orderNumber}</span>
                          <span className="block max-w-32 truncate text-xs font-normal text-slate-500">
                            {payment.order.customerName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada pembayaran tercatat.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
