import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function InlineNotice({
  message,
  variant = "error",
  className = "",
}: {
  message: string;
  variant?: "error" | "success" | "warning";
  className?: string;
}) {
  const success = variant === "success";
  const warning = variant === "warning";
  const Icon = success ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={success || warning ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5 ${
        success
          ? "border-[#d7e9de] bg-[#f2f8f4] text-[#397154]"
          : warning
            ? "border-[#eee2c9] bg-[#fff9eb] text-[#8d713f]"
            : "border-[#f2d9d5] bg-[#fff7f5] text-[#a5463d]"
      } ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[11px] leading-4 text-[#b4473d]">
      {message}
    </p>
  );
}
