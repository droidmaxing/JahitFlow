import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Masuk admin" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin/dashboard");
  return <LoginForm />;
}
