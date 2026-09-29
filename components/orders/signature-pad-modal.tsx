"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import type SignatureCanvasHandle from "react-signature-canvas";
import { LoaderCircle, RotateCcw, Signature } from "lucide-react";
import { toast } from "sonner";
import { completeHandover } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignaturePadModal({ orderId }: { orderId: string }) {
  const signatureRef = useRef<SignatureCanvasHandle>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function saveSignature() {
    const canvas = signatureRef.current;
    if (!canvas || canvas.isEmpty()) {
      toast.error("Minta pelanggan membubuhkan tanda tangan terlebih dahulu.");
      return;
    }

    setPending(true);
    try {
      const result = await completeHandover(orderId, canvas.toDataURL("image/png"));
      if (!result.success) {
        toast.error(result.error ?? "Serah terima gagal disimpan.");
        return;
      }
      toast.success("Serah terima berhasil disimpan.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("[SignaturePadModal]", error);
      toast.error(
        "Serah terima belum berhasil disimpan. Data pesanan tetap aman; silakan coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Signature aria-hidden="true" className="mr-2 size-4" />
          Serah terima
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tanda tangan penerimaan</DialogTitle>
          <DialogDescription>
            Pastikan pesanan sudah lunas dan siap diserahkan kepada pelanggan.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
          <SignatureCanvas
            ref={signatureRef}
            penColor="#172554"
            canvasProps={{
              className: "h-52 w-full touch-none",
              "aria-label": "Area tanda tangan pelanggan",
            }}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signatureRef.current?.clear()}
          >
            <RotateCcw aria-hidden="true" className="mr-2 size-4" />
            Hapus tanda tangan
          </Button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button type="button" onClick={saveSignature} disabled={pending}>
            {pending ? (
              <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
            ) : null}
            Simpan serah terima
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
