import { formatCurrency, formatDate } from "@/lib/utils";

type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  dueDate: Date | null;
  notes: string | null;
  subtotal: { toString(): string };
  discount: { toString(): string };
  total: { toString(): string };
  customer: { name: string; phone: string; address: string | null };
  items: {
    name: string;
    material: string | null;
    totalPcs: number;
    pricePerPiece: { toString(): string };
    subtotal: { toString(): string };
    sizes: { size: string; quantity: number }[];
  }[];
  payments: {
    method: string;
    note: string | null;
    amount: { toString(): string };
    paidAt: Date;
  }[];
};

export function InvoicePrintView({ order }: { order: InvoiceOrder }) {
  const paid = order.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  return (
    <article
      id="invoice-print"
      aria-hidden="true"
      className="print-sheet pointer-events-none fixed left-[-9999px] top-0 w-[794px] bg-white p-12 text-slate-900"
    >
      <header className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
        <div>
          <p className="text-2xl font-bold tracking-tight">JAHITFLOW</p>
          <p className="mt-1 text-xs text-slate-600">Nota pembayaran pesanan konveksi</p>
          <p className="mt-4 text-xs text-slate-600">Workshop Konveksi</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">NOTA PESANAN</p>
          <p className="mt-2 font-mono text-sm font-semibold">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-slate-600">Tanggal: {formatDate(order.createdAt)}</p>
          <p className="mt-1 text-xs text-slate-600">Selesai: {formatDate(order.dueDate)}</p>
        </div>
      </header>
      <section className="mt-7 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pelanggan</p>
          <p className="mt-2 font-semibold">{order.customer.name}</p>
          <p className="mt-1">{order.customer.phone}</p>
          {order.customer.address ? <p className="mt-1">{order.customer.address}</p> : null}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Catatan</p>
          <p className="mt-2 leading-relaxed">{order.notes || "—"}</p>
        </div>
      </section>
      <table className="mt-8 w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-slate-300 bg-slate-50">
            <th className="px-2 py-2.5">Produk</th>
            <th className="px-2 py-2.5">Rincian ukuran</th>
            <th className="px-2 py-2.5 text-right">Jumlah</th>
            <th className="px-2 py-2.5 text-right">Harga/pcs</th>
            <th className="px-2 py-2.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="border-b border-slate-200 align-top">
              <td className="px-2 py-3">
                <p className="font-semibold">{item.name}</p>
                {item.material ? <p className="mt-1 text-slate-500">{item.material}</p> : null}
              </td>
              <td className="px-2 py-3">
                {item.sizes.map((size) => `${size.size}: ${size.quantity}`).join(" · ")}
              </td>
              <td className="px-2 py-3 text-right">{item.totalPcs}</td>
              <td className="px-2 py-3 text-right">{formatCurrency(item.pricePerPiece.toString())}</td>
              <td className="px-2 py-3 text-right font-medium">{formatCurrency(item.subtotal.toString())}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="ml-auto mt-6 w-[310px] space-y-2 text-sm">
        <PrintRow label="Subtotal" value={formatCurrency(order.subtotal.toString())} />
        <PrintRow label="Diskon" value={`− ${formatCurrency(order.discount.toString())}`} />
        <PrintRow label="Total" value={formatCurrency(order.total.toString())} strong />
        <PrintRow label="Sudah dibayar" value={formatCurrency(paid)} />
        <div className="border-t border-slate-400 pt-2">
          <PrintRow label="Sisa pembayaran" value={formatCurrency(Math.max(0, Number(order.total) - paid))} strong />
        </div>
      </section>
      <section className="mt-8 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold">Riwayat pembayaran</p>
        <div className="mt-2 space-y-1">
          {order.payments.map((payment, index) => (
            <p key={`${payment.paidAt.toISOString()}-${index}`} className="text-xs text-slate-600">
              {formatDate(payment.paidAt)} · {payment.note || payment.method} · {formatCurrency(payment.amount.toString())}
            </p>
          ))}
          {!order.payments.length ? <p className="text-xs text-slate-500">Belum ada pembayaran.</p> : null}
        </div>
      </section>
      <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-xs">
        <div>
          <p>Kasir</p>
          <div className="mx-auto mt-16 w-40 border-t border-slate-400" />
        </div>
        <div>
          <p>Pelanggan</p>
          <div className="mx-auto mt-16 w-40 border-t border-slate-400" />
        </div>
      </footer>
    </article>
  );
}

function PrintRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-bold" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
