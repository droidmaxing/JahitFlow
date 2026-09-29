import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CreateOrderForm } from "@/components/orders/create-order-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pesanan baru" };

export default async function NewOrderPage() {
  const productTemplates = await prisma.productTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      material: true,
      defaultPrice: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/orders"
        className="no-print mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kembali ke pesanan
      </Link>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">KASIR / ORDER</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Buat pesanan baru
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Isi data pelanggan, detail produk, ukuran, dan pembayaran awal.
        </p>
      </div>
      <CreateOrderForm
        productTemplates={productTemplates.map((product) => ({
          ...product,
          defaultPrice:
            product.defaultPrice === null ? null : Number(product.defaultPrice),
        }))}
      />
    </div>
  );
}
