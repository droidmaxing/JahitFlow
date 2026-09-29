"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackingSearchForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = orderNumber.trim().toUpperCase();
    const suffix = phoneSuffix.replace(/\D/g, "").slice(-4);
    if (!normalized || suffix.length !== 4) return;
    router.push(
      `/track/${encodeURIComponent(normalized)}?phone=${encodeURIComponent(suffix)}`,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid w-full gap-2 ${compact ? "max-w-xl" : "max-w-2xl"} sm:grid-cols-[minmax(0,1fr)_150px_auto]`}
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Nomor pesanan</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="Contoh: KNV-260901-0001"
          autoComplete="off"
          required
          className="h-13 rounded-xl border-white/20 bg-white pl-12 text-base shadow-sm placeholder:text-muted-foreground/70"
        />
      </label>
      <label className="min-w-0">
        <span className="sr-only">Empat digit terakhir nomor WhatsApp</span>
        <Input
          value={phoneSuffix}
          onChange={(event) =>
            setPhoneSuffix(event.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="4 digit WhatsApp"
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]{4}"
          minLength={4}
          maxLength={4}
          required
          className="h-13 rounded-xl border-white/20 bg-white text-base shadow-sm placeholder:text-xs placeholder:text-muted-foreground/70"
        />
      </label>
      <Button
        type="submit"
        className="h-13 shrink-0 rounded-xl px-5 text-sm font-semibold sm:px-6"
      >
        <span className="hidden sm:inline">Lacak pesanan</span>
        <span className="sm:hidden">Lacak</span>
        <ArrowRight aria-hidden="true" className="ml-1 size-4" />
      </Button>
    </form>
  );
}
