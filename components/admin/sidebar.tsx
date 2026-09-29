"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ChartNoAxesCombined,
  Factory,
  LayoutDashboard,
  PackageSearch,
  Plus,
  Settings,
  Scissors,
  UserRoundCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pesanan", icon: ClipboardList },
  { href: "/admin/products", label: "Produk", icon: PackageSearch },
  { href: "/admin/production", label: "Produksi", icon: Factory },
  { href: "/admin/reports", label: "Laporan", icon: ChartNoAxesCombined, ownerOnly: true },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings, ownerOnly: true },
  { href: "/admin/admins", label: "Kelola admin", icon: UserRoundCog, ownerOnly: true },
];

export function Sidebar({
  user,
}: {
  user: { role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="no-print flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <Link href="/admin/dashboard" className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
          <Scissors aria-hidden="true" className="size-5" />
        </span>
        <span>
          <span className="block font-bold tracking-tight text-slate-950">
            jahit<span className="text-primary">flow</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            WORKSHOP CONSOLE
          </span>
        </span>
      </Link>

      <div className="hidden px-3 pt-4 lg:block">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        <Link
          href="/admin/orders/new"
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="size-4" />
          Buat pesanan baru
        </Link>
      </div>

      <nav aria-label="Navigasi admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-7 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        <p className="hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:block">
          Menu utama
        </p>
        {navigation
          .filter(({ ownerOnly }) => !ownerOnly || user.role === "OWNER")
          .map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href === "/admin/orders" &&
              pathname.startsWith("/admin/orders/")) ||
            (href === "/admin/products" &&
              pathname.startsWith("/admin/products")) ||
            (href === "/admin/production" &&
              pathname.startsWith("/admin/production")) ||
            (href === "/admin/reports" &&
              pathname.startsWith("/admin/reports"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon aria-hidden="true" className="size-[18px]" />
              {label}
            </Link>
          );
          })}
        <Link
          href="/admin/orders/new"
          className="flex h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 lg:hidden"
        >
          <Plus aria-hidden="true" className="size-[18px]" />
          Pesanan baru
        </Link>
      </nav>

    </aside>
  );
}
