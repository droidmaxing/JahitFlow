"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Pencil, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { createAdmin, updateAdmin } from "@/actions/admins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type AdminAccount = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
};

type AdminFields = Pick<AdminAccount, "name" | "email" | "isActive"> & {
  password: string;
};

const emptyAdmin: AdminFields = {
  name: "",
  email: "",
  password: "",
  isActive: true,
};

export function AdminAccountsManager({ admins }: { admins: AdminAccount[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newAdmin, setNewAdmin] = useState(emptyAdmin);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminFields>(emptyAdmin);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    startTransition(async () => {
      try {
        const result = await createAdmin(newAdmin);
        if (!result.success) {
          setCreateError(result.error);
          return;
        }
        setNewAdmin(emptyAdmin);
        toast.success("Akun admin berhasil dibuat.");
        router.refresh();
      } catch (actionError) {
        console.error("[AdminAccountsManager:create]", actionError);
        setCreateError("Akun admin belum berhasil dibuat. Data tetap aman; silakan coba lagi.");
      }
    });
  }

  function beginEdit(admin: AdminAccount) {
    setEditError("");
    setEditingId(admin.id);
    setEditingAdmin({
      name: admin.name,
      email: admin.email,
      password: "",
      isActive: admin.isActive,
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setEditError("");
    startTransition(async () => {
      try {
        const result = await updateAdmin({ id: editingId, ...editingAdmin });
        if (!result.success) {
          setEditError(result.error);
          return;
        }
        setEditingId(null);
        setEditingAdmin(emptyAdmin);
        toast.success("Perubahan akun admin berhasil disimpan.");
        router.refresh();
      } catch (actionError) {
        console.error("[AdminAccountsManager:update]", actionError);
        setEditError("Perubahan belum berhasil disimpan. Data akun tetap aman; silakan coba lagi.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus aria-hidden="true" className="size-4 text-primary" />
            Tambah admin baru
          </CardTitle>
          <p className="text-sm leading-5 text-slate-500">
            Akun yang dibuat selalu memiliki role Admin/Kasir, bukan Owner.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama admin">
              <Input
                autoComplete="name"
                value={newAdmin.name}
                onChange={(event) =>
                  setNewAdmin({ ...newAdmin, name: event.target.value })
                }
                minLength={2}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Email untuk masuk">
              <Input
                type="email"
                autoComplete="email"
                value={newAdmin.email}
                onChange={(event) =>
                  setNewAdmin({ ...newAdmin, email: event.target.value })
                }
                maxLength={191}
                required
              />
            </Field>
            <Field label="Kata sandi awal">
              <Input
                type="password"
                autoComplete="new-password"
                value={newAdmin.password}
                onChange={(event) =>
                  setNewAdmin({ ...newAdmin, password: event.target.value })
                }
                minLength={12}
                maxLength={72}
                required
              />
            </Field>
            <p className="self-end pb-2 text-xs leading-5 text-slate-500">
              Minimal 12 karakter; beri kata sandi awal kepada admin secara aman.
            </p>
            {createError ? <ErrorMessage message={createError} /> : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                )}
                Buat akun admin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="admin-list-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="admin-list-heading" className="text-lg font-semibold text-slate-950">
              Daftar admin
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {admins.length} akun tercatat · akun dinonaktifkan tetap tersimpan
            </p>
          </div>
        </div>
        {admins.length ? (
          admins.map((admin) => (
            <Card key={admin.id} className="rounded-2xl shadow-sm">
              {editingId === admin.id ? (
                <CardContent className="pt-4">
                  <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama admin">
                      <Input
                        autoComplete="name"
                        value={editingAdmin.name}
                        onChange={(event) =>
                          setEditingAdmin({ ...editingAdmin, name: event.target.value })
                        }
                        minLength={2}
                        maxLength={120}
                        required
                      />
                    </Field>
                    <Field label="Email untuk masuk">
                      <Input
                        type="email"
                        autoComplete="email"
                        value={editingAdmin.email}
                        onChange={(event) =>
                          setEditingAdmin({ ...editingAdmin, email: event.target.value })
                        }
                        maxLength={191}
                        required
                      />
                    </Field>
                    <Field label="Kata sandi baru (opsional)">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={editingAdmin.password}
                        onChange={(event) =>
                          setEditingAdmin({ ...editingAdmin, password: event.target.value })
                        }
                        minLength={editingAdmin.password ? 12 : undefined}
                        maxLength={72}
                        placeholder="Kosongkan jika tidak diubah"
                      />
                    </Field>
                    <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={editingAdmin.isActive}
                        onChange={(event) =>
                          setEditingAdmin({
                            ...editingAdmin,
                            isActive: event.target.checked,
                          })
                        }
                        className="size-4 rounded border-slate-300 accent-primary"
                      />
                      Akun aktif dan dapat login
                    </label>
                    {editError ? <ErrorMessage message={editError} /> : null}
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <Button type="submit" disabled={pending}>
                        {pending ? (
                          <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Check aria-hidden="true" className="mr-2 size-4" />
                        )}
                        Simpan perubahan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditError("");
                        }}
                        disabled={pending}
                      >
                        <X aria-hidden="true" className="mr-2 size-4" />
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              ) : (
                <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                      {admin.isActive ? (
                        <UserRound aria-hidden="true" className="size-5" />
                      ) : (
                        <ShieldCheck aria-hidden="true" className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{admin.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            admin.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {admin.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">{admin.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Admin/Kasir · dibuat {formatDate(admin.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => beginEdit(admin)}
                    className="w-full sm:w-auto"
                  >
                    <Pencil aria-hidden="true" className="mr-2 size-4" />
                    Ubah akun
                  </Button>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card className="rounded-2xl border-dashed shadow-none">
            <CardContent className="py-10 text-center">
              <UserRound aria-hidden="true" className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-800">Belum ada akun Admin/Kasir</p>
              <p className="mt-1 text-sm text-slate-500">
                Buat akun admin pertama melalui formulir di atas.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-800">
      {label}
      {children}
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:col-span-2"
    >
      {message}
    </p>
  );
}
