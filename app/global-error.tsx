"use client";

import { useEffect } from "react";
import "./globals.css";
import { ErrorFallback } from "@/components/error-fallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">
        <ErrorFallback reset={reset} />
      </body>
    </html>
  );
}
