"use server";

import { PaymentStatus, Prisma, ProductionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createOrderSchema, paymentSchema } from "@/lib/schemas";
import { generateOrderNumber } from "@/lib/order-number";
import { ActionError } from "@/lib/action-error";
import { actionErrorMessage } from "@/lib/action-error-message";

export type ActionResult =
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string };

export async function createOrder(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data pesanan tidak valid.",
    };
  }

  const data = parsed.data;
  const items = data.items.map((item) => {
    const sizes = item.sizes.filter((size) => size.quantity > 0);
    const totalPcs = sizes.reduce((sum, size) => sum + size.quantity, 0);
    return {
      ...item,
      sizes,
      totalPcs,
      subtotal: totalPcs * item.pricePerPiece,
    };
  });

  if (items.some((item) => item.totalPcs < 1)) {
    return {
      success: false,
      error: "Setiap produk harus memiliki jumlah ukuran.",
    };
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (data.discount > subtotal) {
    return { success: false, error: "Diskon tidak boleh melebihi subtotal." };
  }

  const total = subtotal - data.discount;
  if (data.initialPayment > total) {
    return {
      success: false,
      error: "Pembayaran awal melebihi total pesanan.",
    };
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
          where: { phone: data.customerPhone },
          update: {
            name: data.customerName,
            email: data.customerEmail || null,
            address: data.customerAddress || null,
          },
          create: {
            name: data.customerName,
            phone: data.customerPhone,
            email: data.customerEmail || null,
            address: data.customerAddress || null,
          },
        });

        return tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            createdById: user.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail || null,
            customerAddress: data.customerAddress || null,
            createdByName: user.name,
            dueDate: data.dueDate
              ? new Date(`${data.dueDate}T12:00:00+07:00`)
              : null,
            notes: data.notes || null,
            subtotal: new Prisma.Decimal(subtotal),
            discount: new Prisma.Decimal(data.discount),
            total: new Prisma.Decimal(total),
            paymentStatus:
              data.initialPayment === 0
                ? PaymentStatus.UNPAID
                : data.initialPayment >= total
                  ? PaymentStatus.FULLY_PAID
                  : PaymentStatus.DP_PAID,
            items: {
              create: items.map((item) => ({
                name: item.name,
                description: item.description || null,
                material: item.material || null,
                pricePerPiece: new Prisma.Decimal(item.pricePerPiece),
                totalPcs: item.totalPcs,
                subtotal: new Prisma.Decimal(item.subtotal),
                sizes: { create: item.sizes },
              })),
            },
            statusLogs: {
              create: {
                changedById: user.id,
                changedByName: user.name,
                fromStatus: null,
                toStatus: ProductionStatus.WAITING,
                note: "Pesanan dibuat.",
              },
            },
            ...(data.initialPayment > 0
              ? {
                  payments: {
                    create: {
                      recordedById: user.id,
                      recordedByName: user.name,
                      amount: new Prisma.Decimal(data.initialPayment),
                      method: data.paymentMethod,
                      note: "Pembayaran awal",
                    },
                  },
                }
              : {}),
          },
          select: { id: true, orderNumber: true },
        });
      });

      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/orders");
      revalidatePath("/admin/production");
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 7
      ) {
        continue;
      }
      return {
        success: false,
        error: actionErrorMessage(
          error,
          "createOrder",
          "Pesanan belum berhasil disimpan. Data yang sudah ada tetap aman; silakan coba lagi.",
        ),
      };
    }
  }

  return {
    success: false,
    error: "Nomor pesanan belum berhasil dibuat. Tidak ada perubahan yang disimpan; silakan coba lagi.",
  };
}

export async function addPayment(
  orderId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = paymentSchema.safeParse(input);
  if (!orderId || !parsed.success) {
    return { success: false, error: "Data pembayaran tidak valid." };
  }
  const payment = parsed.data;

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { payments: true },
        });
        if (!order) throw new ActionError("Pesanan tidak ditemukan.");
        if (
          order.status === ProductionStatus.CANCELLED ||
          order.status === ProductionStatus.COMPLETED
        ) {
          throw new ActionError("Pesanan ini tidak dapat menerima pembayaran.");
        }

        const paid = order.payments.reduce(
          (sum, entry) => sum + Number(entry.amount),
          0,
        );
        const outstanding = Number(order.total) - paid;
        if (payment.amount > outstanding) {
          throw new ActionError("Pembayaran melebihi sisa tagihan.");
        }

        const nextPaid = paid + payment.amount;
        await tx.paymentLog.create({
          data: {
            orderId,
            recordedById: user.id,
            recordedByName: user.name,
            amount: new Prisma.Decimal(payment.amount),
            method: payment.method,
            note: payment.note || null,
          },
        });
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus:
              nextPaid >= Number(order.total)
                ? PaymentStatus.FULLY_PAID
                : PaymentStatus.DP_PAID,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "addPayment",
        "Pembayaran belum berhasil dicatat. Tidak ada pembayaran ganda yang dibuat; silakan coba lagi.",
      ),
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
  return { success: true, orderId, orderNumber: "" };
}

export async function completeHandover(
  orderId: string,
  signatureDataUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (
    !orderId ||
    typeof signatureDataUrl !== "string" ||
    !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signatureDataUrl) ||
    signatureDataUrl.length > 750_000
  ) {
    return { success: false, error: "Tanda tangan tidak valid." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });
      if (!order) throw new ActionError("Pesanan tidak ditemukan.");
      const paid = order.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      if (paid < Number(order.total)) {
        throw new ActionError("Pesanan harus lunas sebelum serah terima.");
      }
      if (order.status !== ProductionStatus.READY_FOR_PICKUP) {
        throw new ActionError("Pesanan harus berstatus siap diambil.");
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: ProductionStatus.COMPLETED,
          signatureDataUrl,
          completedAt: new Date(),
        },
      });
      await tx.statusLog.create({
        data: {
          orderId,
          changedById: user.id,
          changedByName: user.name,
          fromStatus: ProductionStatus.READY_FOR_PICKUP,
          toStatus: ProductionStatus.COMPLETED,
          note: "Serah terima ditandatangani konsumen.",
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "completeHandover",
        "Serah terima belum berhasil disimpan. Data pesanan tetap aman; silakan coba lagi.",
      ),
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/production");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
