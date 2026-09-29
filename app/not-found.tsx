import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, House, Search, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
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
        <span className="font-mono text-7xl font-bold tracking-tight text-primary/20">
          404
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Tautan mungkin sudah berubah atau alamat yang Anda masukkan kurang
          tepat. Anda bisa kembali ke beranda atau mencari pesanan.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <House aria-hidden="true" className="mr-2 size-4" />
              Ke beranda
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/track">
              <Search aria-hidden="true" className="mr-2 size-4" />
              Cari pesanan
            </Link>
          </Button>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali
        </Link>
      </section>
    </main>
  );
}
