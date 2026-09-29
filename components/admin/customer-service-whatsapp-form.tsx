"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { saveCustomerServiceWhatsApp } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerServiceWhatsAppForm({
  initialPhone,
}: {
  initialPhone: string;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await saveCustomerServiceWhatsApp(phone);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Nomor WhatsApp customer service berhasil disimpan.");
    } catch (error) {
      console.error("[CustomerServiceWhatsAppForm]", error);
      toast.error("Nomor WhatsApp belum berhasil disimpan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm font-medium text-slate-800">
        Nomor WhatsApp yang dapat dihubungi pelanggan
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="083121893686"
          minLength={8}
          maxLength={20}
          required
        />
      </label>
      <p className="text-xs leading-5 text-slate-500">
        Boleh menggunakan format lokal (08...) atau internasional (628...).
        Tombol WhatsApp di pelacakan pesanan publik akan memakai nomor ini.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="mr-2 size-4 animate-spin"
          />
        ) : (
          <Save aria-hidden="true" className="mr-2 size-4" />
        )}
        Simpan nomor
      </Button>
    </form>
  );
}
