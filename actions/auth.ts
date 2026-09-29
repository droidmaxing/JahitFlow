"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";
import { actionErrorMessage } from "@/lib/action-error-message";

export type LoginState = { error?: string };

export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data login tidak valid.",
    };
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (
      !user ||
      !user.isActive ||
      !(await compare(parsed.data.password, user.passwordHash))
    ) {
      return { error: "Email atau kata sandi tidak sesuai." };
    }

    await createSession(user.id, user.sessionVersion);
  } catch (error) {
    return {
      error: actionErrorMessage(
        error,
        "signInAction",
        "Layanan login sedang mengalami gangguan. Silakan coba lagi beberapa saat.",
      ),
    };
  }

  redirect("/admin/dashboard");
}

export async function signOutAction() {
  await clearSession();
  redirect("/login");
}
