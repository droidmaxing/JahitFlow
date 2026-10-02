"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("App route render failed", { digest: error.digest });
  }, [error]);

  return (
    <ErrorState
      code="500"
      title="Halaman belum dapat dimuat"
      description="Terjadi gangguan saat menyiapkan halaman. Coba lagi sebentar lagi."
      onRetry={retry}
    />
  );
}
