"use client";

import { useWatch, type Control, type UseFormRegister } from "react-hook-form";
import type { CreateOrderInput } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const baseSizes = ["S", "M", "L", "XL", "XXL", "Custom"];

export function SizeMatrixInput({
  control,
  register,
  itemIndex,
}: {
  control: Control<CreateOrderInput>;
  register: UseFormRegister<CreateOrderInput>;
  itemIndex: number;
}) {
  const sizeValues = useWatch({
    control,
    name: `items.${itemIndex}.sizes` as const,
  });
  const pricePerPiece = useWatch({
    control,
    name: `items.${itemIndex}.pricePerPiece` as const,
  });
  const totalPcs = sizeValues?.reduce((sum, size) => sum + Number(size.quantity || 0), 0) ?? 0;
  const subtotal = totalPcs * Number(pricePerPiece || 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-3 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-500 sm:grid-cols-[1fr_150px_1fr]">
        <span>Ukuran</span>
        <span className="text-center">Jumlah</span>
        <span className="hidden text-right sm:block">Subtotal ukuran</span>
      </div>
      <div className="divide-y divide-slate-100">
        {baseSizes.map((size, sizeIndex) => {
          const sizeName =
            `items.${itemIndex}.sizes.${sizeIndex}.size` as const;
          const quantityName =
            `items.${itemIndex}.sizes.${sizeIndex}.quantity` as const;
          const quantity = Number(sizeValues?.[sizeIndex]?.quantity || 0);

          return (
            <div
              key={size}
              className="grid grid-cols-3 items-center gap-3 px-3 py-2 sm:grid-cols-[1fr_150px_1fr]"
            >
              {size === "Custom" ? (
                <Input
                  {...register(sizeName)}
                  aria-label={`Nama ukuran custom produk ${itemIndex + 1}`}
                  className="h-9 min-w-0"
                  placeholder="Custom"
                  maxLength={32}
                />
              ) : (
                <span className="text-sm font-semibold text-slate-800">{size}</span>
              )}
              <Input
                {...register(quantityName, { valueAsNumber: true })}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                aria-label={`Jumlah ukuran ${size} produk ${itemIndex + 1}`}
                className="h-9 text-center"
              />
              <span className="hidden text-right text-sm text-slate-500 sm:block">
                {formatCurrency(quantity * Number(pricePerPiece || 0))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-blue-50/60 px-3 py-3">
        <span className="text-sm text-slate-600">
          Total jumlah: <strong className="text-slate-950">{totalPcs} pcs</strong>
        </span>
        <span className="text-sm font-semibold text-primary">
          Subtotal: {formatCurrency(subtotal)}
        </span>
      </div>
    </div>
  );
}
