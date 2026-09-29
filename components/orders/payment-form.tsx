"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { addPayment } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaymentForm({
  orderId,
  outstanding,
}: {
  orderId: string;
  outstanding: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER" | "QRIS">("CASH");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await addPayment(orderId, {
        amount: Number(amount),
        method,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pembayaran berhasil dicatat.");
      setAmount("");
      router.refresh();
    } catch (error) {
      console.error("[PaymentForm]", error);
      toast.error(
        "Pembayaran belum berhasil dicatat. Silakan muat ulang halaman lalu coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block space-y-2 text-sm font-medium text-slate-800">
        Jumlah pembayaran
        <Input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          inputMode="numeric"
          min={1}
          max={outstanding}
          step={1}
          required
          placeholder="Contoh: 500000"
        />
      </label>
      <label className="block space-y-2 text-sm font-medium text-slate-800">
        Metode
        <select
          value={method}
          onChange={(event) =>
            setMethod(event.target.value as "CASH" | "TRANSFER" | "QRIS")
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="CASH">Tunai</option>
          <option value="TRANSFER">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
      </label>
      <Button type="submit" disabled={pending || outstanding <= 0} className="w-full">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
        ) : null}
        Catat pembayaran
      </Button>
    </form>
  );
}
