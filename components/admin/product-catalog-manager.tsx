"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  saveProductTemplate,
  setProductTemplateActive,
} from "@/actions/products";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ProductTemplateItem = {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  defaultPrice: number | null;
  isActive: boolean;
};

type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  material: string;
  defaultPrice: string;
};

const emptyProduct: ProductFormValues = {
  name: "",
  description: "",
  material: "",
  defaultPrice: "",
};

export function ProductCatalogManager({
  products,
}: {
  products: ProductTemplateItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>(emptyProduct);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(form.id);

  function beginEdit(product: ProductTemplateItem) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      material: product.material ?? "",
      defaultPrice:
        product.defaultPrice === null ? "" : String(product.defaultPrice),
    });
    setError("");
    document.getElementById("product-template-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function resetForm() {
    setForm(emptyProduct);
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveProductTemplate({
        ...form,
        defaultPrice: form.defaultPrice,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEditing ? "Template produk diperbarui." : "Template produk ditambahkan.");
      resetForm();
      router.refresh();
    });
  }

  function toggleActive(product: ProductTemplateItem) {
    startTransition(async () => {
      const result = await setProductTemplateActive({
        id: product.id,
        isActive: !product.isActive,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        product.isActive ? "Template diarsipkan." : "Template diaktifkan kembali.",
      );
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card id="product-template-form" className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            {isEditing ? "Ubah template produk" : "Tambah template produk"}
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Batal mengubah template"
                onClick={resetForm}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama produk *">
              <Input
                required
                minLength={2}
                maxLength={160}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Contoh: Kaos komunitas"
              />
            </Field>
            <Field label="Bahan (opsional)">
              <Input
                maxLength={160}
                value={form.material}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    material: event.target.value,
                  }))
                }
                placeholder="Contoh: Cotton combed 24s"
              />
            </Field>
            <Field label="Harga default per pcs (opsional)">
              <Input
                type="number"
                min={1}
                step={1000}
                inputMode="numeric"
                value={form.defaultPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultPrice: event.target.value,
                  }))
                }
                placeholder="Kosongkan jika harga selalu menyesuaikan"
              />
            </Field>
            <Field label="Spesifikasi default (opsional)">
              <Textarea
                maxLength={1000}
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Contoh: sablon satu sisi, bordir logo..."
              />
            </Field>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              ) : isEditing ? (
                <Pencil aria-hidden="true" className="mr-2 size-4" />
              ) : (
                <Plus aria-hidden="true" className="mr-2 size-4" />
              )}
              {isEditing ? "Simpan perubahan" : "Tambah ke katalog"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Daftar template <span className="text-slate-500">({products.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent
          role="region"
          aria-label="Daftar template produk"
          tabIndex={0}
          className="max-h-[70vh] space-y-3 overflow-y-auto overscroll-contain"
        >
          {products.length > 6 ? (
            <p className="text-xs text-slate-500">
              Gulir daftar ini untuk melihat semua template.
            </p>
          ) : null}
          {products.length ? (
            products.map((product) => (
              <article
                key={product.id}
                className={`rounded-xl border p-4 ${
                  product.isActive
                    ? "border-slate-200 bg-white"
                    : "border-dashed border-slate-300 bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Diarsipkan"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {product.material || "Bahan fleksibel"}
                      {product.defaultPrice === null
                        ? " · Harga menyesuaikan"
                        : ` · ${formatCurrency(product.defaultPrice)} / pcs`}
                    </p>
                    {product.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEdit(product)}
                      disabled={isPending}
                    >
                      <Pencil aria-hidden="true" className="mr-1.5 size-3.5" />
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(product)}
                      disabled={isPending}
                      aria-label={
                        product.isActive
                          ? `Arsipkan ${product.name}`
                          : `Aktifkan ${product.name}`
                      }
                    >
                      {isPending ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-3.5 animate-spin"
                        />
                      ) : product.isActive ? (
                        <Archive aria-hidden="true" className="size-3.5" />
                      ) : (
                        <RotateCcw aria-hidden="true" className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada template. Anda tetap bisa membuat pesanan dengan mengisi
              detail produk secara manual.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-800">
      {label}
      {children}
    </label>
  );
}
