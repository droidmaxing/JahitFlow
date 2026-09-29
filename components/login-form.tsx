"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Scissors } from "lucide-react";
import { signInAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Scissors aria-hidden="true" className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950">
            jahit<span className="text-primary">flow</span>
          </span>
        </Link>
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-sm font-semibold text-primary">AREA ADMIN</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Selamat datang kembali
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Masuk untuk mengelola pesanan dan progres produksi.
          </p>
          <form action={action} className="mt-7 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="nama@konveksi.id"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                Kata sandi
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11"
              />
            </div>
            {state.error ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
              >
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="h-11 w-full">
              {pending ? (
                <>
                  <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  Memeriksa…
                </>
              ) : (
                "Masuk ke dashboard"
              )}
            </Button>
          </form>
          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke halaman utama
          </Link>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Akun awal disiapkan melalui proses seed lokal. Kata sandi tersimpan di
          file `.env` dan tidak ditampilkan pada aplikasi.
        </p>
      </div>
    </main>
  );
}
