import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProductSeed = {
  id: string;
  name: string;
  description: string;
  material: string | null;
  defaultPrice: number | null;
};

const products = [
  {
    id: "seed-product-kaos-combed-24s",
    name: "Kaos Cotton Combed 24s",
    description: "Template dasar kaos; sablon, warna, dan finishing dapat disesuaikan.",
    material: "Cotton Combed 24s",
    defaultPrice: 85_000,
  },
  {
    id: "seed-product-kaos-combed-30s",
    name: "Kaos Cotton Combed 30s",
    description: "Kaos ringan untuk kegiatan komunitas atau acara.",
    material: "Cotton Combed 30s",
    defaultPrice: 75_000,
  },
  {
    id: "seed-product-polo-pique",
    name: "Kaos Polo",
    description: "Bordir logo dan pilihan kerah dapat disesuaikan per pesanan.",
    material: "Pique CVC",
    defaultPrice: 125_000,
  },
  {
    id: "seed-product-kemeja-drill",
    name: "Kemeja Seragam",
    description: "Spesifikasi saku, bordir, dan model mengikuti kebutuhan pelanggan.",
    material: "Drill",
    defaultPrice: 155_000,
  },
  {
    id: "seed-product-hoodie-fleece",
    name: "Hoodie",
    description: "Model pullover atau zipper, cetak dan detail menyesuaikan pesanan.",
    material: "Fleece",
    defaultPrice: 225_000,
  },
  {
    id: "seed-product-varsity",
    name: "Jaket Varsity",
    description: "Warna badan, lengan, bordir, dan jumlah patch dapat diubah.",
    material: "Fleece / kulit sintetis",
    defaultPrice: 295_000,
  },
  {
    id: "seed-product-celana-training",
    name: "Celana Training",
    description: "Ukuran, aksen, dan detail sablon mengikuti pesanan.",
    material: "Polyester",
    defaultPrice: 135_000,
  },
  {
    id: "seed-product-totebag-kanvas",
    name: "Totebag",
    description: "Ukuran tas, panjang tali, dan cetak dapat disesuaikan.",
    material: "Kanvas",
    defaultPrice: 65_000,
  },
  {
    id: "seed-product-custom",
    name: "Produk Custom",
    description: "Template fleksibel tanpa bahan maupun harga default.",
    material: null,
    defaultPrice: null,
  },
] satisfies ProductSeed[];

async function main() {
  const result = await prisma.productTemplate.createMany({
    data: products,
    skipDuplicates: true,
  });
  console.log(
    `${result.count} template produk baru ditambahkan; template yang sudah ada tidak diubah.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed produk gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
