"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, LoaderCircle, QrCode, Tv2 } from "lucide-react";

type LinkResource = { label: string; url: string };

export function AccessLinks({
  businessSlug,
  branchId,
  qrEnabled,
  displayEnabled,
}: {
  businessSlug: string;
  branchId: string;
  qrEnabled: boolean;
  displayEnabled: boolean;
}) {
  const [busy, setBusy] = useState<"qr" | "display" | null>(null);
  const [resource, setResource] = useState<LinkResource | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function create(kind: "qr" | "display") {
    setBusy(kind);
    setError("");
    setResource(null);
    try {
      const response = await fetch(
        `/api/v1/businesses/${businessSlug}/${kind === "qr" ? "qr-tokens" : "displays"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "qr"
              ? { branchId }
              : { branchId, name: `Display ${new Date().toLocaleDateString("id-ID")}` },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Tautan gagal dibuat.");
      }
      const path =
        kind === "qr" ? result.data.url : `/display/${result.data.token}`;
      const origin = window.location.origin;
      setResource({
        label: kind === "qr" ? "QR antrean" : "TV Display",
        url: new URL(path, origin).toString(),
      });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Terjadi kesalahan.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    if (!resource) return;
    await navigator.clipboard.writeText(resource.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-2xl border border-[#e9edeb] bg-white p-5 shadow-[0_2px_8px_rgba(25,48,40,.025)] md:p-6">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-.02em]">Akses pelanggan & display</h2>
        <p className="mt-1 text-xs text-[#929e99]">
          Tautan bertoken aman dibuat hanya saat diminta.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void create("qr")}
          disabled={!qrEnabled || busy !== null}
          className="flex items-center gap-3 rounded-xl border border-[#e9edeb] p-4 text-left transition hover:border-[#b8d5c7] hover:bg-[#fbfdfb] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf5f1] text-[#34775f]">
            {busy === "qr" ? <LoaderCircle className="size-5 animate-spin" /> : <QrCode className="size-5" />}
          </span>
          <span>
            <span className="block text-xs font-semibold text-[#40504a]">Buat QR antrean</span>
            <span className="mt-1 block text-[10px] text-[#929e99]">
              {qrEnabled ? "Buat tautan baru untuk dicetak." : "Fitur antrean QR sedang nonaktif."}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => void create("display")}
          disabled={!displayEnabled || busy !== null}
          className="flex items-center gap-3 rounded-xl border border-[#e9edeb] p-4 text-left transition hover:border-[#b8d5c7] hover:bg-[#fbfdfb] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#f1eff9] text-[#8071a8]">
            {busy === "display" ? <LoaderCircle className="size-5 animate-spin" /> : <Tv2 className="size-5" />}
          </span>
          <span>
            <span className="block text-xs font-semibold text-[#40504a]">Buat TV Display</span>
            <span className="mt-1 block text-[10px] text-[#929e99]">
              {displayEnabled ? "Tautan fullscreen khusus cabang." : "Fitur TV Display sedang nonaktif."}
            </span>
          </span>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {resource && (
        <div className="mt-4 rounded-xl border border-[#dcebe2] bg-[#f5faf7] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#3d594b]">{resource.label} berhasil dibuat</p>
              <p className="mt-1 truncate text-[11px] text-[#698374]">{resource.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => void copyLink()}
                className="flex size-8 items-center justify-center rounded-lg border border-[#dcebe2] bg-white text-[#527864] hover:bg-[#f7fbf8]"
                aria-label="Salin tautan"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg border border-[#dcebe2] bg-white text-[#527864] hover:bg-[#f7fbf8]"
                aria-label="Buka tautan"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#91a69a]">
            Simpan tautan ini dengan aman. Token tidak ditampilkan lagi setelah panel ditutup.
          </p>
        </div>
      )}
    </section>
  );
}
