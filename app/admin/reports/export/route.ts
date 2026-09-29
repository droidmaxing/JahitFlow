import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { statusLabels } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { getReportPeriod, isValidReportDate } from "@/lib/report-period";

export const dynamic = "force-dynamic";

function addHeaderStyle(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 24;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<ExcelJS.Column>[],
  rows: Record<string, unknown>[],
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.addRows(rows);
  addHeaderStyle(sheet);
  if (rows.length) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };
  }
  return sheet;
}

function remainingBalance(total: number, paid: number) {
  return Math.max(0, total - paid);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  }
  if (user.role !== Role.OWNER) {
    return NextResponse.json(
      { error: "Ekspor laporan hanya tersedia untuk Owner." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const requestedFrom = url.searchParams.get("from") ?? undefined;
  const requestedTo = url.searchParams.get("to") ?? undefined;
  if (
    (requestedFrom && !isValidReportDate(requestedFrom)) ||
    (requestedTo && !isValidReportDate(requestedTo))
  ) {
    return NextResponse.json(
      { error: "Tanggal laporan tidak valid." },
      { status: 400 },
    );
  }

  const period = getReportPeriod(requestedFrom, requestedTo);
  if (period.hasInvalidRange) {
    return NextResponse.json(
      { error: "Tanggal mulai harus sama dengan atau sebelum tanggal akhir." },
      { status: 400 },
    );
  }
  const { from, to, startDate, endDate, currentDate } = period;

  try {
    const [periodOrders, periodPayments, receivableOrders, productionOrders] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: { gte: startDate, lt: endDate },
            status: { not: "CANCELLED" },
          },
          orderBy: { createdAt: "asc" },
          select: {
            customerId: true,
            orderNumber: true,
            createdAt: true,
            customerName: true,
            status: true,
            paymentStatus: true,
            total: true,
            items: { select: { name: true, totalPcs: true } },
            payments: { select: { amount: true } },
          },
        }),
        prisma.paymentLog.findMany({
          where: { paidAt: { gte: startDate, lt: endDate } },
          orderBy: { paidAt: "asc" },
          select: {
            paidAt: true,
            amount: true,
            method: true,
            note: true,
            recordedByName: true,
            order: {
              select: { orderNumber: true, customerName: true },
            },
          },
        }),
        prisma.order.findMany({
          where: { status: { not: "CANCELLED" } },
          orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          select: {
            orderNumber: true,
            customerName: true,
            status: true,
            paymentStatus: true,
            dueDate: true,
            total: true,
            payments: { select: { amount: true } },
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
          _count: { _all: true },
        }),
      ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "JahitFlow";
    workbook.created = new Date();
    workbook.subject = `Laporan bisnis ${from} sampai ${to}`;
    workbook.title = `Laporan bisnis ${from} - ${to}`;
    workbook.company = "JahitFlow";
    workbook.calcProperties.fullCalcOnLoad = true;

    const received = periodPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const orderValue = periodOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalPieces = periodOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.totalPcs, 0),
      0,
    );
    const receivables = receivableOrders
      .map((order) => {
        const paid = order.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );
        const balance = remainingBalance(Number(order.total), paid);
        const overdue =
          order.dueDate !== null &&
          order.dueDate < currentDate &&
          order.status !== "COMPLETED" &&
          balance > 0;
        return { order, paid, balance, overdue };
      })
      .filter(({ balance }) => balance > 0);
    const totalReceivables = receivables.reduce(
      (sum, entry) => sum + entry.balance,
      0,
    );
    const overdueReceivables = receivables.reduce(
      (sum, entry) => sum + (entry.overdue ? entry.balance : 0),
      0,
    );
    const paymentsByMethod = new Map<string, number>();
    for (const payment of periodPayments) {
      const method = payment.method.toUpperCase();
      paymentsByMethod.set(
        method,
        (paymentsByMethod.get(method) ?? 0) + Number(payment.amount),
      );
    }
    const customerTotals = new Map<
      string,
      { name: string; orders: number; pieces: number; amount: number }
    >();
    for (const order of periodOrders) {
      const current = customerTotals.get(order.customerId) ?? {
        name: order.customerName,
        orders: 0,
        pieces: 0,
        amount: 0,
      };
      current.orders += 1;
      current.pieces += order.items.reduce(
        (sum, item) => sum + item.totalPcs,
        0,
      );
      current.amount += Number(order.total);
      customerTotals.set(order.customerId, current);
    }

    const summary = workbook.addWorksheet("Ringkasan");
    summary.columns = [
      { header: "Indikator", key: "metric", width: 34 },
      { header: "Nilai", key: "value", width: 24 },
    ];
    summary.addRows([
      { metric: "Periode laporan", value: `${from} sampai ${to}` },
      { metric: "Pesanan baru (di luar batal)", value: periodOrders.length },
      { metric: "Jumlah pcs pesanan", value: totalPieces },
      { metric: "Nilai pesanan baru", value: orderValue },
      { metric: "Pembayaran masuk pada periode", value: received },
      { metric: "Piutang berjalan", value: totalReceivables },
      { metric: "Piutang jatuh tempo", value: overdueReceivables },
      { metric: "Jumlah pembayaran pada periode", value: periodPayments.length },
    ]);
    addHeaderStyle(summary);
    for (const rowNumber of [5, 6, 7, 8]) {
      summary.getCell(rowNumber, 2).numFmt = '"Rp" #,##0';
    }
    summary.addRow([]);
    summary.addRow({ metric: "Pembayaran berdasarkan metode" });
    summary.addRow({ metric: "Metode", value: "Jumlah" });
    for (const [method, amount] of paymentsByMethod) {
      const row = summary.addRow({ metric: method, value: amount });
      row.getCell(2).numFmt = '"Rp" #,##0';
    }
    const statusStartRow = summary.rowCount + 2;
    summary.addRow([]);
    summary.addRow({ metric: "Pesanan dalam produksi saat ini" });
    summary.addRow({ metric: "Tahap produksi", value: "Jumlah pesanan" });
    for (const entry of productionOrders) {
      summary.addRow({
        metric: statusLabels[entry.status],
        value: entry._count._all,
      });
    }
    summary.getRow(statusStartRow).font = { bold: true };

    const orderSheet = addTableSheet(
      workbook,
      "Pesanan",
      [
        { header: "Nomor pesanan", key: "orderNumber", width: 22 },
        { header: "Tanggal dibuat", key: "createdAt", width: 22 },
        { header: "Pelanggan", key: "customer", width: 26 },
        { header: "Rincian item", key: "items", width: 48 },
        { header: "Jumlah pcs", key: "pieces", width: 14 },
        { header: "Status produksi", key: "status", width: 22 },
        { header: "Status pembayaran", key: "paymentStatus", width: 22 },
        { header: "Sudah dibayar", key: "paid", width: 20 },
        { header: "Nilai pesanan", key: "total", width: 20 },
        { header: "Sisa tagihan", key: "balance", width: 20 },
      ],
      periodOrders.map((order) => {
        const paid = order.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );
        return {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customer: order.customerName,
          items: order.items.map((item) => `${item.name} (${item.totalPcs} pcs)`).join("; "),
          pieces: order.items.reduce((sum, item) => sum + item.totalPcs, 0),
          status: statusLabels[order.status],
          paymentStatus: order.paymentStatus,
          paid,
          total: Number(order.total),
          balance: remainingBalance(Number(order.total), paid),
        };
      }),
    );
    orderSheet.getColumn("createdAt").numFmt = "dd mmm yyyy hh:mm";
    for (const column of ["paid", "total", "balance"]) {
      orderSheet.getColumn(column).numFmt = '"Rp" #,##0';
    }

    const paymentSheet = addTableSheet(
      workbook,
      "Pembayaran",
      [
        { header: "Tanggal pembayaran", key: "paidAt", width: 22 },
        { header: "Nomor pesanan", key: "orderNumber", width: 22 },
        { header: "Pelanggan", key: "customer", width: 26 },
        { header: "Jumlah", key: "amount", width: 20 },
        { header: "Metode", key: "method", width: 18 },
        { header: "Catatan", key: "note", width: 34 },
        { header: "Dicatat oleh", key: "recordedBy", width: 24 },
      ],
      periodPayments.map((payment) => ({
        paidAt: payment.paidAt,
        orderNumber: payment.order.orderNumber,
        customer: payment.order.customerName,
        amount: Number(payment.amount),
        method: payment.method,
        note: payment.note ?? "",
        recordedBy: payment.recordedByName,
      })),
    );
    paymentSheet.getColumn("paidAt").numFmt = "dd mmm yyyy hh:mm";
    paymentSheet.getColumn("amount").numFmt = '"Rp" #,##0';

    const receivableSheet = addTableSheet(
      workbook,
      "Piutang",
      [
        { header: "Nomor pesanan", key: "orderNumber", width: 22 },
        { header: "Pelanggan", key: "customer", width: 26 },
        { header: "Jatuh tempo", key: "dueDate", width: 20 },
        { header: "Status produksi", key: "status", width: 22 },
        { header: "Status pembayaran", key: "paymentStatus", width: 22 },
        { header: "Nilai pesanan", key: "total", width: 20 },
        { header: "Sudah dibayar", key: "paid", width: 20 },
        { header: "Sisa tagihan", key: "balance", width: 20 },
        { header: "Terlambat", key: "overdue", width: 14 },
      ],
      receivables.map(({ order, paid, balance, overdue }) => ({
        orderNumber: order.orderNumber,
        customer: order.customerName,
        dueDate: order.dueDate,
        status: statusLabels[order.status],
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        paid,
        balance,
        overdue: overdue ? "Ya" : "Tidak",
      })),
    );
    receivableSheet.getColumn("dueDate").numFmt = "dd mmm yyyy";
    for (const column of ["total", "paid", "balance"]) {
      receivableSheet.getColumn(column).numFmt = '"Rp" #,##0';
    }

    addTableSheet(
      workbook,
      "Pelanggan",
      [
        { header: "Pelanggan", key: "customer", width: 30 },
        { header: "Jumlah pesanan", key: "orders", width: 18 },
        { header: "Jumlah pcs", key: "pieces", width: 16 },
        { header: "Nilai pesanan", key: "amount", width: 22 },
      ],
      [...customerTotals.values()]
        .sort((left, right) => right.amount - left.amount)
        .map((entry) => ({
          customer: entry.name,
          orders: entry.orders,
          pieces: entry.pieces,
          amount: entry.amount,
        })),
    ).getColumn("amount").numFmt = '"Rp" #,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `jahitflow-laporan-${from}-${to}.xlsx`;
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[exportOwnerReport]", error);
    return NextResponse.json(
      { error: "Laporan belum berhasil diekspor. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
