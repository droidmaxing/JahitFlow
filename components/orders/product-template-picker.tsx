"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ProductTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  defaultPrice: number | null;
};

export function ProductTemplatePicker({
  products,
  onSelect,
}: {
  products: ProductTemplateOption[];
  onSelect: (product: ProductTemplateOption) => void;
}) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductTemplateOption | null>(null);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      [product.name, product.material, product.description]
        .filter(Boolean)
        .some((value) =>
          value!.toLocaleLowerCase("id-ID").includes(normalizedQuery),
        ),
    );
  }, [products, query]);

  function chooseProduct(product: ProductTemplateOption) {
    setSelectedProduct(product);
    setQuery(product.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(product);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        filteredProducts.length
          ? current < 0
            ? 0
            : (current + 1) % filteredProducts.length
          : -1,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        filteredProducts.length
          ? current < 0
            ? filteredProducts.length - 1
            : (current - 1 + filteredProducts.length) % filteredProducts.length
          : -1,
      );
      return;
    }
    if (
      event.key === "Enter" &&
      isOpen &&
      filteredProducts[activeIndex]
    ) {
      event.preventDefault();
      chooseProduct(filteredProducts[activeIndex]);
    }
  }

  function clearSelection() {
    setSelectedProduct(null);
    setQuery("");
    setIsOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={`${listboxId}-input`}
        className="block text-sm font-medium text-slate-800"
      >
        Isi dari template (opsional)
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400"
        />
        <Input
          ref={inputRef}
          id={`${listboxId}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && filteredProducts[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          value={query}
          onFocus={() => {
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedProduct(null);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari nama produk, bahan, atau spesifikasi..."
          className="h-10 pl-9 pr-10"
        />
        {query ? (
          <button
            type="button"
            aria-label="Hapus pencarian template"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSelection}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}

        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Hasil template produk"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            {filteredProducts.length ? (
              filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedProduct?.id === product.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseProduct(product)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left outline-none ${
                    activeIndex === index
                      ? "bg-blue-50 text-slate-950"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {product.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {product.material || "Bahan fleksibel"}
                      {product.defaultPrice === null
                        ? " · harga menyesuaikan"
                        : ` · ${formatCurrency(product.defaultPrice)} / pcs`}
                    </span>
                  </span>
                  {selectedProduct?.id === product.id ? (
                    <Check
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                  ) : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                Tidak ada template yang cocok. Lanjutkan dengan mengisi produk
                custom di bawah.
              </p>
            )}
          </div>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">
        Cari berdasarkan nama atau bahan. Setelah dipilih, semua detail pesanan
        tetap bisa diedit.
      </p>
    </div>
  );
}
