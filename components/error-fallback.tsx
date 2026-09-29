"use client";

import Link from "next/link";
import { ArrowLeft, House, RefreshCw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorFallback({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
              <Scissors aria-hidden="true" className="size-4" />
            </span>
            <span className="font-bold text-slate-900">
              jahit<span className="text-primary">flow</span>
            </span>
          </Link>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <RefreshCw aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Terjadi kendala
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Halaman belum dapat ditampilkan
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Maaf, terjadi gangguan saat memuat halaman ini. Silakan coba lagi atau
          kembali ke beranda.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            Coba lagi
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <House aria-hidden="true" className="mr-2 size-4" />
              Ke beranda
            </Link>
          </Button>
        </div>
        <Link
          href="/track"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Cari pesanan
        </Link>
      </section>
    </main>
  );
}
