import type { Metadata } from "next";
import { PackagePlus } from "lucide-react";
import { ProductCatalogManager } from "@/components/admin/product-catalog-manager";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Katalog produk" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireUser();
  const products = await prisma.productTemplate.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      material: true,
      defaultPrice: true,
      isActive: true,
    },
  });

  const serializedProducts = products.map((product) => ({
    ...product,
    defaultPrice:
      product.defaultPrice === null ? null : Number(product.defaultPrice),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">KATALOG FLEKSIBEL</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Template produk
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Simpan jenis produk yang sering dipesan sebagai titik awal. Harga dan
          detail bisa disesuaikan pada setiap order; produk custom tetap bisa
          langsung diketik.
        </p>
      </div>
      <Card className="rounded-2xl border-blue-100 bg-blue-50/60 shadow-sm">
        <CardContent className="flex gap-3 p-4 text-sm leading-6 text-slate-700">
          <PackagePlus
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <p>
            Mengubah atau mengarsipkan template hanya memengaruhi penggunaan
            berikutnya. Rincian pada pesanan lama tetap tersimpan sebagaimana
            dicatat.
          </p>
        </CardContent>
      </Card>
      <ProductCatalogManager products={serializedProducts} />
    </div>
  );
}
