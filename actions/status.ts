"use server";

import { ProductionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canTransitionStatus } from "@/lib/order-status";
import { ActionError } from "@/lib/action-error";
import { actionErrorMessage } from "@/lib/action-error-message";

export async function updateOrderStatus(
  orderId: string,
  nextStatus: ProductionStatus,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (!orderId || !Object.values(ProductionStatus).includes(nextStatus)) {
    return { success: false, error: "Pembaruan status tidak valid." };
  }
  if (nextStatus === ProductionStatus.COMPLETED) {
    return {
      success: false,
      error: "Status selesai hanya dapat ditetapkan melalui serah terima bertanda tangan.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ActionError("Pesanan tidak ditemukan.");
      if (!canTransitionStatus(order.status, nextStatus)) {
        throw new ActionError("Perubahan status tersebut tidak diperbolehkan.");
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
      await tx.statusLog.create({
        data: {
          orderId,
          changedById: user.id,
          changedByName: user.name,
          fromStatus: order.status,
          toStatus: nextStatus,
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "updateOrderStatus",
        "Perubahan status belum tersimpan. Status sebelumnya tetap aman; silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/production");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/track");
  return { success: true };
}
