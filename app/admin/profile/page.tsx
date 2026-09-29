import type { Metadata } from "next";
import { KeyRound, UserRound } from "lucide-react";
import { ProfileForm } from "@/components/admin/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil saya" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">AKUN SAYA</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Profil saya
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Perbarui nama atau email akun. Perubahan kata sandi akan mengakhiri sesi
          login lama akun ini.
        </p>
      </div>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound aria-hidden="true" className="size-4 text-primary" />
            Informasi akun
          </CardTitle>
          <p className="text-sm text-slate-500">
            Role akun: {user.role === "OWNER" ? "Owner" : "Admin / Kasir"} · role
            hanya dapat ditetapkan oleh sistem.
          </p>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name} initialEmail={user.email} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-blue-100 bg-blue-50/50 shadow-none">
        <CardContent className="flex gap-3 pt-4">
          <KeyRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-slate-600">
            Untuk keamanan, kata sandi saat ini diminta setiap kali profil
            disimpan. Jika mengganti kata sandi, gunakan minimal 12 karakter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
