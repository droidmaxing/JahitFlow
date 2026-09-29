import { PaymentStatus, Prisma, PrismaClient, ProductionStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function requiredPassword(name: string) {
  const value = process.env[name];
  if (!value || value.length < 12) {
    throw new Error(`${name} wajib diatur dengan minimal 12 karakter di .env.`);
  }
  return value;
}

async function main() {
  const ownerPassword = await hash(requiredPassword("SEED_OWNER_PASSWORD"), 12);
  const adminPassword = await hash(requiredPassword("SEED_ADMIN_PASSWORD"), 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@konveksi.local" },
    update: { name: "Pemilik Konveksi", role: Role.OWNER, passwordHash: ownerPassword },
    create: {
      name: "Pemilik Konveksi",
      email: "owner@konveksi.local",
      passwordHash: ownerPassword,
      role: Role.OWNER,
    },
  });
  const admin = await prisma.user.upsert({
    where: { email: "kasir@konveksi.local" },
    update: { name: "Admin / Kasir", role: Role.ADMIN, passwordHash: adminPassword },
    create: {
      name: "Admin / Kasir",
      email: "kasir@konveksi.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const samples = [
    {
      orderNumber: "KNV-260901-0001",
      customer: { name: "Rina Pratama", phone: "081234567801" },
      status: ProductionStatus.SEWING,
      dueDate: new Date("2026-10-05T12:00:00+07:00"),
      item: {
        name: "Kaos komunitas",
        material: "Cotton combed 24s",
        price: 85_000,
        sizes: [["S", 8], ["M", 18], ["L", 12], ["XL", 6]] as const,
      },
      paid: 1_870_000,
      paymentNote: "DP 50%",
      note: "Sablon satu sisi, warna navy.",
    },
    {
      orderNumber: "KNV-260902-0002",
      customer: { name: "Budi Santoso", phone: "081234567802" },
      status: ProductionStatus.READY_FOR_PICKUP,
      dueDate: new Date("2026-09-30T12:00:00+07:00"),
      item: {
        name: "Seragam kerja",
        material: "Drill premium",
        price: 125_000,
        sizes: [["M", 6], ["L", 12], ["XL", 8], ["XXL", 4]] as const,
      },
      paid: 3_750_000,
      paymentNote: "Lunas via transfer",
      note: "Bordir logo di dada kiri.",
    },
  ];

  for (const sample of samples) {
    const customer = await prisma.customer.upsert({
      where: { phone: sample.customer.phone },
      update: { name: sample.customer.name },
      create: sample.customer,
    });
    const subtotal = sample.item.sizes.reduce(
      (sum, [, quantity]) => sum + sample.item.price * quantity,
      0,
    );
    const existing = await prisma.order.findUnique({
      where: { orderNumber: sample.orderNumber },
      select: { id: true },
    });
    if (existing) continue;

    const statusHistory =
      sample.status === ProductionStatus.SEWING
        ? [
            { fromStatus: null, toStatus: ProductionStatus.WAITING, note: "Pesanan diterima." },
            { fromStatus: ProductionStatus.WAITING, toStatus: ProductionStatus.CUTTING, note: "Bahan mulai dipotong." },
            { fromStatus: ProductionStatus.CUTTING, toStatus: ProductionStatus.SEWING, note: "Masuk proses jahit." },
          ]
        : [
            { fromStatus: null, toStatus: ProductionStatus.WAITING, note: "Pesanan diterima." },
            { fromStatus: ProductionStatus.WAITING, toStatus: ProductionStatus.CUTTING, note: "Bahan mulai dipotong." },
            { fromStatus: ProductionStatus.CUTTING, toStatus: ProductionStatus.SEWING, note: "Masuk proses jahit." },
            { fromStatus: ProductionStatus.SEWING, toStatus: ProductionStatus.QC_PACKING, note: "Pemeriksaan kualitas." },
            { fromStatus: ProductionStatus.QC_PACKING, toStatus: ProductionStatus.READY_FOR_PICKUP, note: "Pesanan siap diambil." },
          ];

    await prisma.order.create({
      data: {
        orderNumber: sample.orderNumber,
        customerId: customer.id,
        createdById: admin.id,
        status: sample.status,
        paymentStatus:
          sample.paid >= subtotal ? PaymentStatus.FULLY_PAID : PaymentStatus.DP_PAID,
        dueDate: sample.dueDate,
        notes: sample.note,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(subtotal),
        items: {
          create: {
            name: sample.item.name,
            material: sample.item.material,
            pricePerPiece: new Prisma.Decimal(sample.item.price),
            totalPcs: sample.item.sizes.reduce((sum, [, qty]) => sum + qty, 0),
            subtotal: new Prisma.Decimal(subtotal),
            sizes: {
              create: sample.item.sizes.map(([size, quantity]) => ({ size, quantity })),
            },
          },
        },
        payments: {
          create: {
            recordedById: admin.id,
            amount: new Prisma.Decimal(sample.paid),
            method: sample.paymentNote.includes("transfer") ? "TRANSFER" : "CASH",
            note: sample.paymentNote,
          },
        },
        statusLogs: {
          create: statusHistory.map((entry) => ({
            ...entry,
            changedById: entry.toStatus === ProductionStatus.WAITING ? owner.id : admin.id,
          })),
        },
      },
    });
  }

  console.log("Seed selesai. Password awal berada di .env lokal dan tidak dicetak.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
