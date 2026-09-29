"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/actions/orders";
import { createOrderSchema, type CreateOrderInput } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { SizeMatrixInput } from "@/components/orders/size-matrix-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const makeItem = (): CreateOrderInput["items"][number] => ({
  name: "",
  description: "",
  material: "",
  pricePerPiece: 0,
  sizes: ["S", "M", "L", "XL", "XXL", "Custom"].map((size) => ({
    size,
    quantity: 0,
  })),
});

const initialValues: CreateOrderInput = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  dueDate: "",
  notes: "",
  discount: 0,
  initialPayment: 0,
  paymentMethod: "CASH",
  items: [makeItem()],
};

export function CreateOrderForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: initialValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const discount = useWatch({ control: form.control, name: "discount" }) ?? 0;
  const initialPayment =
    useWatch({ control: form.control, name: "initialPayment" }) ?? 0;

  const subtotal =
    watchedItems?.reduce((sum, item) => {
      const pcs = item.sizes.reduce(
        (total, size) => total + Number(size.quantity || 0),
        0,
      );
      return sum + pcs * Number(item.pricePerPiece || 0);
    }, 0) ?? 0;
  const total = Math.max(0, subtotal - Number(discount || 0));
  const balance = Math.max(0, total - Number(initialPayment || 0));

  async function onSubmit(values: CreateOrderInput) {
    setServerError("");
    try {
      const result = await createOrder(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      toast.success(`Pesanan ${result.orderNumber} berhasil dibuat.`);
      router.push(`/admin/orders/${result.orderId}`);
      router.refresh();
    } catch (error) {
      console.error("[CreateOrderForm]", error);
      const message =
        "Pesanan belum berhasil disimpan. Data yang sudah ada tetap aman; silakan coba lagi.";
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Informasi pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama pelanggan" error={form.formState.errors.customerName?.message}>
            <Input
              {...form.register("customerName")}
              autoComplete="name"
              placeholder="Nama sesuai pesanan"
            />
          </Field>
          <Field label="Nomor WhatsApp" error={form.formState.errors.customerPhone?.message}>
            <Input
              {...form.register("customerPhone")}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
            />
          </Field>
          <Field label="Email (opsional)" error={form.formState.errors.customerEmail?.message}>
            <Input
              {...form.register("customerEmail")}
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
            />
          </Field>
          <Field label="Alamat (opsional)">
            <Input
              {...form.register("customerAddress")}
              autoComplete="street-address"
              placeholder="Alamat pelanggan"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Item {index + 1}</CardTitle>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus item ${index + 1}`}
                  onClick={() => remove(index)}
                  className="text-slate-500 hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nama produk"
                  error={form.formState.errors.items?.[index]?.name?.message}
                >
                  <Input
                    {...form.register(`items.${index}.name`)}
                    placeholder="Kaos, kemeja, jaket..."
                  />
                </Field>
                <Field
                  label="Bahan"
                  error={form.formState.errors.items?.[index]?.material?.message}
                >
                  <Input
                    {...form.register(`items.${index}.material`)}
                    placeholder="Contoh: Cotton combed 24s"
                  />
                </Field>
                <Field
                  label="Harga per pcs"
                  error={form.formState.errors.items?.[index]?.pricePerPiece?.message}
                >
                  <Input
                    {...form.register(`items.${index}.pricePerPiece`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    placeholder="85000"
                  />
                </Field>
                <Field label="Spesifikasi (opsional)">
                  <Input
                    {...form.register(`items.${index}.description`)}
                    placeholder="Sablon, bordir, warna..."
                  />
                </Field>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  Matrix ukuran dan jumlah
                </p>
                <SizeMatrixInput
                  control={form.control}
                  register={form.register}
                  itemIndex={index}
                />
                {Array.isArray(
                  form.formState.errors.items?.[index]?.sizes,
                )
                  ? form.formState.errors.items[index].sizes.map(
                      (sizeError, sizeIndex) =>
                        sizeError?.size?.message ? (
                          <p
                            key={sizeIndex}
                            role="alert"
                            className="mt-2 text-xs text-destructive"
                          >
                            {sizeError.size.message}
                          </p>
                        ) : null,
                    )
                  : null}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append(makeItem())}
          className="w-full border-dashed bg-white"
        >
          <Plus aria-hidden="true" className="mr-2 size-4" />
          Tambah item produk
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Jadwal & catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Estimasi selesai"
              error={form.formState.errors.dueDate?.message}
            >
              <Input {...form.register("dueDate")} type="date" />
            </Field>
            <Field label="Catatan pesanan">
              <Textarea
                {...form.register("notes")}
                rows={4}
                maxLength={5000}
                placeholder="Instruksi khusus produksi..."
              />
            </Field>
          </CardContent>
        </Card>
        <Card className="h-fit rounded-2xl border-blue-100">
          <CardHeader>
            <CardTitle className="text-base">Ringkasan pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Diskon">
              <Input
                {...form.register("discount", { valueAsNumber: true })}
                type="number"
                min={0}
                step={1000}
              />
            </Field>
            <div className="space-y-2 border-y border-dashed border-slate-200 py-3 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="Diskon" value={`− ${formatCurrency(discount || 0)}`} />
              <SummaryRow label="Total pesanan" value={formatCurrency(total)} strong />
            </div>
            <Field label="Pembayaran awal (DP)">
              <Input
                {...form.register("initialPayment", { valueAsNumber: true })}
                type="number"
                min={0}
                step={1000}
              />
            </Field>
            <label className="block space-y-2 text-sm font-medium text-slate-800">
              Metode pembayaran
              <select
                {...form.register("paymentMethod")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="CASH">Tunai</option>
                <option value="TRANSFER">Transfer</option>
                <option value="QRIS">QRIS</option>
              </select>
            </label>
            <div className="rounded-xl bg-amber-50 px-3 py-3 text-sm">
              <SummaryRow
                label="Sisa tagihan"
                value={formatCurrency(balance)}
                strong
              />
            </div>
            {serverError ? (
              <p role="alert" aria-live="assertive" className="text-sm text-destructive">
                {serverError}
              </p>
            ) : null}
            {Object.keys(form.formState.errors).length > 0 ? (
              <p role="alert" className="text-sm text-destructive">
                Periksa kembali data pesanan yang wajib diisi.
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full"
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan pesanan
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-800">
      {label}
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        strong ? "font-semibold text-slate-950" : "text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
