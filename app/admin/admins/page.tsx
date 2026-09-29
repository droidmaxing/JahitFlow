import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Kelola admin" };
export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const user = await requireUser();
  if (user.role !== Role.OWNER) redirect("/admin/dashboard");

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">KHUSUS OWNER</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Kelola akun admin
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Buat akun Admin/Kasir, ubah data atau kata sandinya, dan nonaktifkan
          akses tanpa menghapus akun maupun riwayat transaksi.
        </p>
      </div>
      <AdminAccountsManager admins={admins} />
    </div>
  );
}
