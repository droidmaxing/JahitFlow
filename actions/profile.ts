"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, createSession } from "@/lib/auth";
import { ActionError } from "@/lib/action-error";
import { actionErrorMessage } from "@/lib/action-error-message";
import { updateProfileSchema } from "@/lib/schemas";

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateOwnProfile(
  input: unknown,
): Promise<ProfileActionResult> {
  const sessionUser = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data profil tidak valid.",
    };
  }

  const { name, email, currentPassword, newPassword } = parsed.data;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });
    if (!currentUser || !(await compare(currentPassword, currentUser.passwordHash))) {
      throw new ActionError("Kata sandi saat ini tidak sesuai.");
    }

    const passwordHash = newPassword ? await hash(newPassword, 12) : undefined;
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name,
        email,
        ...(passwordHash
          ? { passwordHash, sessionVersion: { increment: 1 } }
          : {}),
      },
      select: { id: true, sessionVersion: true },
    });

    if (passwordHash) {
      await createSession(updatedUser.id, updatedUser.sessionVersion);
    }
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "updateOwnProfile",
        "Profil belum berhasil disimpan. Data akun tetap aman; silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  return { success: true };
}
