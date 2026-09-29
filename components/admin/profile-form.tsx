"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { updateOwnProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileFields = {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ProfileForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<ProfileFields>({
    name: initialName,
    email: initialEmail,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await updateOwnProfile(fields);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setFields((current) => ({
          ...current,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        toast.success("Profil berhasil diperbarui.");
        router.refresh();
      } catch (actionError) {
        console.error("[ProfileForm]", actionError);
        setError("Profil belum berhasil disimpan. Data akun tetap aman; silakan coba lagi.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama tampilan">
          <Input
            autoComplete="name"
            value={fields.name}
            onChange={(event) =>
              setFields({ ...fields, name: event.target.value })
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
            value={fields.email}
            onChange={(event) =>
              setFields({ ...fields, email: event.target.value })
            }
            maxLength={191}
            required
          />
        </Field>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Ubah kata sandi <span className="font-normal text-slate-500">(opsional)</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Kata sandi saat ini">
            <Input
              type="password"
              autoComplete="current-password"
              value={fields.currentPassword}
              onChange={(event) =>
                setFields({ ...fields, currentPassword: event.target.value })
              }
              required
            />
          </Field>
          <span className="hidden sm:block" aria-hidden="true" />
          <Field label="Kata sandi baru">
            <Input
              type="password"
              autoComplete="new-password"
              value={fields.newPassword}
              onChange={(event) =>
                setFields({ ...fields, newPassword: event.target.value })
              }
              minLength={fields.newPassword ? 12 : undefined}
              maxLength={72}
              aria-describedby="new-password-hint"
            />
          </Field>
          <Field label="Konfirmasi kata sandi baru">
            <Input
              type="password"
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={(event) =>
                setFields({ ...fields, confirmPassword: event.target.value })
              }
              minLength={fields.newPassword ? 12 : undefined}
              maxLength={72}
            />
          </Field>
        </div>
        <p id="new-password-hint" className="mt-2 text-xs text-slate-500">
          Kosongkan kedua kolom kata sandi baru jika tidak ingin menggantinya.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="mr-2 size-4" />
        )}
        Simpan profil
      </Button>
    </form>
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
