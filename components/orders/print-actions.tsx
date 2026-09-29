"use client";

import { useState } from "react";
import { Download, LoaderCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PrintActions({ orderNumber }: { orderNumber: string }) {
  const [exporting, setExporting] = useState(false);

  function printDocument(kind: "invoice" | "spk") {
    document.body.dataset.printView = kind;
    window.print();
    window.setTimeout(() => {
      delete document.body.dataset.printView;
    }, 500);
  }

  async function downloadInvoice() {
    setExporting(true);
    try {
      const target = document.getElementById("invoice-print");
      if (!target) throw new Error("Tampilan nota tidak ditemukan.");
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const image = canvas.toDataURL("image/png");
      const width = 190;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(image, "PNG", 10, 10, width, height, undefined, "FAST");
      pdf.save(`nota-${orderNumber}.pdf`);
    } catch (error) {
      console.error("[PrintActions]", error);
      toast.error("Nota belum berhasil dibuat sebagai PDF. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => printDocument("invoice")}>
        <Printer aria-hidden="true" className="mr-2 size-4" />
        Cetak nota
      </Button>
      <Button type="button" variant="outline" onClick={() => printDocument("spk")}>
        <Printer aria-hidden="true" className="mr-2 size-4" />
        Cetak SPK
      </Button>
      <Button type="button" variant="outline" onClick={downloadInvoice} disabled={exporting}>
        {exporting ? (
          <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="mr-2 size-4" />
        )}
        Unduh PDF
      </Button>
    </div>
  );
}
