"use client";

import { LoaderCircle, MoveRight, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ServiceOption = {
  id: string;
  name: string;
  code: string;
  averageMinutes: number;
};

export function PublicQueueForm({
  token,
  services,
}: {
  token: string;
  services: ServiceOption[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedService = services.find((service) => service.id === serviceId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/public/qr/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          customerName: name,
          ...(phone ? { customerPhone: phone } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Nomor antrean gagal dibuat.");
      }
      router.push(result.data.statusUrl);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan. Coba lagi.",
      );
      setLoading(false);
    }
  }

  if (!services.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <TicketCheck className="mx-auto size-8 text-[#91a29b]" />
        <p className="mt-3 text-sm font-semibold text-[#344440]">
          Belum ada layanan tersedia
        </p>
        <p className="mt-1 text-xs text-[#899591]">
          Silakan hubungi petugas di lokasi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-[#45544f]">
          Pilih layanan
        </span>
        <select
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          required
          className="h-12 w-full rounded-xl border border-[#e1e8e4] bg-white px-3.5 text-sm text-[#344440] outline-none focus:border-[#79b39e] focus:ring-4 focus:ring-[#176b5b]/[.08]"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · ±{service.averageMinutes} menit
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-[#45544f]">
          Nama Anda
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          placeholder="Masukkan nama lengkap"
          className="h-12 w-full rounded-xl border border-[#e1e8e4] bg-white px-3.5 text-sm outline-none placeholder:text-[#a3ada9] focus:border-[#79b39e] focus:ring-4 focus:ring-[#176b5b]/[.08]"
        />
      </label>
      <label className="block">
        <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#45544f]">
          Nomor WhatsApp <span className="font-normal text-[#a0aaa6]">Opsional</span>
        </span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          type="tel"
          maxLength={24}
          autoComplete="tel"
          placeholder="+62 812 3456 7890"
          className="h-12 w-full rounded-xl border border-[#e1e8e4] bg-white px-3.5 text-sm outline-none placeholder:text-[#a3ada9] focus:border-[#79b39e] focus:ring-4 focus:ring-[#176b5b]/[.08]"
        />
      </label>
      {selectedService && (
        <div className="flex items-center justify-between rounded-xl bg-[#f1f7f4] px-4 py-3">
          <span className="text-xs text-[#75827f]">Estimasi layanan</span>
          <span className="text-xs font-semibold text-[#176b5b]">
            ±{selectedService.averageMinutes} menit
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !serviceId}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#176b5b] text-sm font-semibold text-white transition hover:bg-[#125648] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Menerbitkan nomor...
          </>
        ) : (
          <>
            Ambil nomor antrean <MoveRight className="size-4" />
          </>
        )}
      </button>
      <p className="text-center text-[10px] leading-4 text-[#a0aaa6]">
        Dengan melanjutkan, data Anda digunakan untuk mengelola layanan antrean ini.
      </p>
    </form>
  );
}
