import { ErrorState } from "@/components/error-state";

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Sepertinya Anda tersesat"
      description="Alamat yang dibuka mungkin sudah berubah, tidak tersedia, atau tautannya sudah kedaluwarsa."
    />
  );
}
