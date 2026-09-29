import { formatDate } from "@/lib/utils";

type ProductionOrder = {
  orderNumber: string;
  createdAt: Date;
  dueDate: Date | null;
  notes: string | null;
  customer: { name: string; phone: string };
  items: {
    name: string;
    description: string | null;
    material: string | null;
    totalPcs: number;
    sizes: { size: string; quantity: number }[];
  }[];
};

export function SpkPrintView({ order }: { order: ProductionOrder }) {
  return (
    <article
      id="spk-print"
      aria-hidden="true"
      className="print-sheet pointer-events-none fixed left-[-9999px] top-0 w-[794px] bg-white p-12 text-slate-900"
    >
      <header className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
        <div>
          <p className="text-2xl font-bold tracking-tight">JAHITFLOW</p>
          <p className="mt-1 text-xs text-slate-600">Lembar kerja produksi</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">SURAT PERINTAH KERJA</p>
          <p className="mt-2 font-mono text-sm font-semibold">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-slate-600">Dibuat: {formatDate(order.createdAt)}</p>
          <p className="mt-1 text-xs text-slate-600">Target: {formatDate(order.dueDate)}</p>
        </div>
      </header>
      <section className="mt-7 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pelanggan</p>
          <p className="mt-2 font-semibold">{order.customer.name}</p>
          <p className="mt-1">{order.customer.phone}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instruksi produksi</p>
          <p className="mt-2 leading-relaxed">{order.notes || "Tidak ada catatan khusus."}</p>
        </div>
      </section>
      <section className="mt-8 space-y-5">
        {order.items.map((item, index) => (
          <article key={`${item.name}-${index}`} className="rounded-xl border border-slate-300 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold">{item.name}</p>
                {item.material ? <p className="mt-1 text-sm text-slate-600">Bahan: {item.material}</p> : null}
                {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">{item.totalPcs} pcs</span>
            </div>
            <table className="mt-5 w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left">Ukuran</th>
                  <th className="px-3 py-2 text-right">Jumlah potong</th>
                </tr>
              </thead>
              <tbody>
                {item.sizes.map((size) => (
                  <tr key={size.size} className="border-b border-slate-100">
                    <td className="px-3 py-2.5">{size.size}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{size.quantity} pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </section>
      <footer className="mt-10 grid grid-cols-3 gap-8 text-center text-xs">
        <div><p>Potong</p><div className="mx-auto mt-20 w-36 border-t border-slate-400" /></div>
        <div><p>Jahit</p><div className="mx-auto mt-20 w-36 border-t border-slate-400" /></div>
        <div><p>QC</p><div className="mx-auto mt-20 w-36 border-t border-slate-400" /></div>
      </footer>
    </article>
  );
}
