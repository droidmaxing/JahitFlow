"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Root layout render failed", { digest: error.digest });
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f4f7f5] font-sans text-[#182321]">
        <ErrorState
          code="500"
          title="Aplikasi sedang mengalami gangguan"
          description="Ada masalah saat menyiapkan aplikasi. Coba muat ulang halaman."
          onRetry={retry}
        />
      </body>
    </html>
  );
}
