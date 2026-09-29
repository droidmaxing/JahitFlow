"use server";

import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { actionErrorMessage } from "@/lib/action-error-message";
import { createAdminSchema, updateAdminSchema } from "@/lib/schemas";
import { ActionError } from "@/lib/action-error";

type AdminActionResult = { success: true } | { success: false; error: string };

async function isOwner() {
  const user = await requireUser();
  return user.role === Role.OWNER;
}

export async function createAdmin(input: unknown): Promise<AdminActionResult> {
  if (!(await isOwner())) {
    return {
      success: false,
      error: "Hanya owner yang dapat mengelola akun admin.",
    };
  }

  const parsed = createAdminSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data admin tidak valid.",
    };
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 12),
        role: Role.ADMIN,
      },
      select: { id: true },
    });
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "createAdmin",
        "Akun admin belum berhasil dibuat. Silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function updateAdmin(input: unknown): Promise<AdminActionResult> {
  if (!(await isOwner())) {
    return {
      success: false,
      error: "Hanya owner yang dapat mengelola akun admin.",
    };
  }

  const parsed = updateAdminSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data admin tidak valid.",
    };
  }

  const { id, name, email, password, isActive } = parsed.data;
  let passwordHash: string | undefined;
  try {
    if (password) passwordHash = await hash(password, 12);

    await prisma.$transaction(
      async (tx) => {
        const admin = await tx.user.findUnique({
          where: { id },
          select: { role: true, isActive: true },
        });
        if (!admin || admin.role !== Role.ADMIN) {
          throw new ActionError("Akun admin tidak ditemukan.");
        }

        if (admin.isActive && !isActive) {
          const activeAdminCount = await tx.user.count({
            where: { role: Role.ADMIN, isActive: true },
          });
          if (activeAdminCount <= 1) {
            throw new ActionError(
              "Admin aktif terakhir tidak dapat dinonaktifkan. Buat admin pengganti terlebih dahulu.",
            );
          }
        }

        await tx.user.update({
          where: { id },
          data: {
            name,
            email,
            isActive,
            ...(passwordHash
              ? { passwordHash, sessionVersion: { increment: 1 } }
              : {}),
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "updateAdmin",
        "Perubahan akun admin belum tersimpan. Data akun tetap aman; silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
  return { success: true };
}
