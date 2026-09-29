import { Prisma } from "@prisma/client";
import { ActionError } from "@/lib/action-error";

export function actionErrorMessage(
  error: unknown,
  context: string,
  fallback: string,
): string {
  if (error instanceof ActionError) return error.message;

  const code =
    error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
  console.error(`[${context}]`, error);

  if (code === "P2002") {
    return "Data yang sama sudah tercatat. Periksa kembali lalu coba lagi.";
  }
  if (code === "P2003" || code === "P2014") {
    return "Data ini masih digunakan oleh riwayat lama, sehingga tidak dapat dihapus atau diubah.";
  }
  if (code === "P2025") {
    return "Data sudah tidak ditemukan atau telah berubah. Muat ulang halaman lalu coba lagi.";
  }
  if (code === "P2034") {
    return "Data sedang diperbarui oleh proses lain. Silakan coba lagi.";
  }

  return fallback;
}
