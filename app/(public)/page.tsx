import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TrackingSearchForm } from "@/components/tracking-search-form";

const benefits = [
  {
    icon: Clock3,
    title: "Progres transparan",
    description: "Lihat tahapan jahit, sablon, hingga pesanan siap diambil.",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran tercatat",
    description: "Pantau pembayaran awal dan sisa tagihan dengan jelas.",
  },
  {
    icon: PackageCheck,
    title: "Pesanan tertata",
    description: "Setiap pesanan memiliki nomor khusus yang mudah dilacak.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="JahitFlow, beranda">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <Scissors aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            jahit<span className="text-primary">flow</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          Masuk admin <ArrowRight aria-hidden="true" className="ml-1 inline size-4" />
        </Link>
      </header>

      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/70 via-slate-50 to-white"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-primary shadow-sm">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Portal pesanan konveksi
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Pesanan rapi,
              <br />
              <span className="text-primary">produksi terpantau.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Cek perjalanan pesanan konveksimu dari potong bahan sampai siap
              dipakai. Semua update ada di satu tempat.
            </p>
            <div className="mt-9">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Masukkan nomor pesanan
              </p>
              <TrackingSearchForm />
              <p className="mt-3 text-xs text-slate-500">
                Nomor pesanan tersedia pada nota atau pesan dari kasir.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {["Update produksi", "Riwayat pembayaran", "Info siap diambil"].map(
                (label) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-emerald-600"
                    />
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-8 size-28 rounded-full bg-blue-100/60 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-900 p-5 shadow-[0_32px_100px_-35px_rgba(30,64,175,0.35)] sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">STATUS PESANAN</p>
                  <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-white">
                    KNV-260928-1042
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  Sedang dijahit
                </span>
              </div>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Kaos komunitas</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      40 pcs · Cotton combed
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                    <Scissors aria-hidden="true" className="size-5" />
                  </div>
                </div>
                <div className="space-y-0">
                  {[
                    ["Pesanan diterima", true],
                    ["Potong bahan", true],
                    ["Sablon / bordir", true],
                    ["Jahit", false],
                    ["QC & packing", false],
                    ["Siap diambil", false],
                  ].map(([label, done], index) => (
                    <div
                      key={String(label)}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      {index < 5 ? (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[11px] top-6 h-full w-px ${
                            done ? "bg-blue-400/60" : "bg-white/10"
                          }`}
                        />
                      ) : null}
                      <span
                        className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? "bg-blue-500 text-white"
                            : label === "Jahit"
                              ? "border border-blue-300 bg-blue-300/10 text-blue-200"
                              : "border border-white/15 text-slate-500"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 aria-hidden="true" className="size-3.5" />
                        ) : label === "Jahit" ? (
                          <span className="size-1.5 rounded-full bg-blue-300" />
                        ) : (
                          <span className="size-1 rounded-full bg-slate-500" />
                        )}
                      </span>
                      <span
                        className={`pt-1 text-xs ${
                          label === "Jahit"
                            ? "font-semibold text-blue-100"
                            : done
                              ? "text-slate-200"
                              : "text-slate-500"
                        }`}
                      >
                        {String(label)}
                        {label === "Jahit" ? (
                          <span className="ml-2 font-normal text-blue-300">
                            Sedang berlangsung
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-xs text-slate-400">Estimasi selesai</span>
                <span className="text-xs font-semibold text-white">5 Oktober 2026</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex lg:-left-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block text-xs text-slate-500">Update terakhir</span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                  Produksi berjalan
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-primary">Lebih mudah untuk semua</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Tenang, pesananmu tercatat.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© 2026 JahitFlow · Sistem manajemen konveksi</span>
          <Link href="/track" className="font-medium text-slate-600 hover:text-primary">
            Cari pesanan <ArrowRight aria-hidden="true" className="ml-1 inline size-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
