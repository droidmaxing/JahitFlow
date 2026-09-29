import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Plus, Search, Scissors } from "lucide-react";
import { ProductionStatus } from "@prisma/client";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { statusLabels } from "@/lib/order-status";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Daftar pesanan" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const status = Object.values(ProductionStatus).includes(
    query.status as ProductionStatus,
  )
    ? (query.status as ProductionStatus)
    : undefined;
  const search = query.q?.trim().slice(0, 100) ?? "";
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search } },
              { customerName: { contains: search } },
              { customerPhone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { select: { totalPcs: true } },
      payments: { select: { amount: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">WORKSPACE</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Daftar pesanan
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Cari order, cek pembayaran, dan buka detail produksi.
          </p>
        </div>
        <Button asChild className="no-print h-10 w-fit">
          <Link href="/admin/orders/new">
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Pesanan baru
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Cari nomor order, nama, atau telepon</span>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari nomor order, nama, atau telepon"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="sr-only" htmlFor="status-filter">
              Filter status produksi
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={status ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Semua status</option>
              {Object.values(ProductionStatus).map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="h-10">
              Terapkan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="pl-5">Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Produksi</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Jatuh tempo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const totalPcs = order.items.reduce(
                    (sum, item) => sum + item.totalPcs,
                    0,
                  );
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="pl-5">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {totalPcs} pcs · {formatDate(order.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block text-sm font-medium text-slate-900">
                          {order.customerName}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {order.customerPhone}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">
                        {formatDate(order.dueDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(order.total.toString())}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          aria-label={`Buka pesanan ${order.orderNumber}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!orders.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-56 text-center">
                      <Scissors aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                      <p className="mt-3 font-medium text-slate-800">
                        {search || status ? "Pesanan tidak ditemukan" : "Belum ada pesanan"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Coba ubah filter atau buat pesanan baru.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            {orders.length} pesanan ditampilkan (maksimal 100)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
