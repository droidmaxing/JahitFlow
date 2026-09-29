import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";
import { TrackingSearchForm } from "@/components/tracking-search-form";

export default function TrackSearchPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
              <Scissors aria-hidden="true" className="size-4" />
            </span>
            <span className="font-bold text-slate-900">
              jahit<span className="text-primary">flow</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="mr-1 inline size-4" />
            Beranda
          </Link>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-primary">
          <Scissors aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
          Cek pesananmu
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          Masukkan nomor pesanan yang ada di nota atau pesan dari kasir.
        </p>
        <div className="mt-7 w-full">
          <TrackingSearchForm compact />
        </div>
        <Link
          href="/"
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}
