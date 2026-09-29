import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Phone } from "lucide-react";
import { CustomerServiceWhatsAppForm } from "@/components/admin/customer-service-whatsapp-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireUser();
  if (user.role !== "OWNER") redirect("/admin/dashboard");

  const setting = await prisma.appSetting.findUnique({
    where: { key: "customerServiceWhatsApp" },
    select: { value: true },
  });
  const phone = setting?.value ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">PENGATURAN WORKSHOP</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Pengaturan kontak
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola nomor layanan pelanggan yang dituju dari halaman pelacakan.
        </p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone aria-hidden="true" className="size-4 text-primary" />
            WhatsApp customer service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerServiceWhatsAppForm
            initialPhone={toLocalPhoneInput(phone)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function toLocalPhoneInput(phone: string) {
  const normalized = normalizeWhatsAppNumber(phone);
  return normalized.startsWith("62")
    ? `0${normalized.slice(2)}`
    : normalized;
}
