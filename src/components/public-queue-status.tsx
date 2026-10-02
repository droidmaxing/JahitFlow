"use client";

import { useEffect, useState } from "react";
import { Clock3, RefreshCw, TicketCheck } from "lucide-react";

type QueueStatus = {
  ticketNumber: string;
  status: string;
  service: string;
  waitingAhead: number;
  estimateMinutes: number;
};

const statusLabels: Record<string, string> = {
  WAITING: "Menunggu giliran",
  CALLED: "Silakan menuju loket",
  SERVING: "Sedang dilayani",
  COMPLETED: "Layanan selesai",
  SKIPPED: "Antrean dilewati",
  CANCELLED: "Antrean dibatalkan",
  NO_SHOW: "Tidak terdeteksi saat dipanggil",
};

export function PublicQueueStatus({ token }: { token: string }) {
  const [data, setData] = useState<QueueStatus | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch(`/api/v1/public/queues/${token}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Status antrean tidak tersedia.");
        if (!cancelled) {
          setData(result.data);
          setError("");
          setUpdatedAt(new Date());
        }
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : "Gagal memuat status antrean.",
          );
        }
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#e8eeeb] bg-white shadow-[0_18px_60px_rgba(28,60,47,.08)]">
      <div className="bg-[#176b5b] px-6 pb-7 pt-7 text-center text-white">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/15">
          <TicketCheck className="size-6" />
        </div>
        <p className="mt-4 text-xs text-white/70">Nomor antrean Anda</p>
        <p className="mt-1 text-4xl font-semibold tracking-[-.04em]">
          {data?.ticketNumber ?? "—"}
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-[#a8e6ce]" />
          {data ? statusLabels[data.status] ?? data.status : "Memuat status..."}
        </p>
      </div>
      <div className="space-y-4 p-6">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="rounded-xl bg-[#f5f8f6] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[.1em] text-[#9aa5a1]">
            Layanan
          </p>
          <p className="mt-1 text-sm font-semibold text-[#344440]">
            {data?.service ?? "—"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#e9edeb] p-4">
            <p className="text-[10px] text-[#9aa5a1]">Antrean di depan</p>
            <p className="mt-1 text-2xl font-semibold text-[#344440]">
              {data?.waitingAhead ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[#e9edeb] p-4">
            <p className="text-[10px] text-[#9aa5a1]">Estimasi tunggu</p>
            <p className="mt-1 flex items-baseline gap-1 text-2xl font-semibold text-[#344440]">
              {data?.estimateMinutes ?? "—"}
              <span className="text-[10px] font-medium text-[#8a9691]">menit</span>
            </p>
          </div>
        </div>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-[#a0aaa6]">
          <RefreshCw className="size-3" />
          {updatedAt
            ? `Diperbarui ${updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · diperbarui otomatis`
            : "Memuat antrean"}
        </p>
        <div className="flex gap-2 rounded-xl bg-[#eef6f1] p-3 text-[11px] leading-5 text-[#658172]">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          Estimasi waktu dapat berubah mengikuti kondisi pelayanan.
        </div>
      </div>
    </section>
  );
}
