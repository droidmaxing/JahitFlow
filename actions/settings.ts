"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { whatsappNumberSchema } from "@/lib/schemas";
import { actionErrorMessage } from "@/lib/action-error-message";

export async function saveCustomerServiceWhatsApp(input: unknown) {
  const user = await requireUser();
  if (user.role !== Role.OWNER) {
    return { success: false, error: "Hanya owner yang dapat mengubah pengaturan ini." };
  }

  const parsed = whatsappNumberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Nomor WhatsApp tidak valid.",
    };
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: "customerServiceWhatsApp" },
      update: { value: parsed.data },
      create: { key: "customerServiceWhatsApp", value: parsed.data },
    });
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "saveCustomerServiceWhatsApp",
        "Pengaturan belum berhasil disimpan. Silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/track");
  return { success: true };
}
