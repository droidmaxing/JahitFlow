"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { signOutAction } from "@/actions/auth";

export function ProfileMenu({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const logoutFormRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Buka menu profil"
            className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 text-left shadow-sm outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-primary">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-slate-900">
                {user.name}
              </span>
              <span className="block text-xs text-slate-500">
                {user.role === "OWNER" ? "Owner" : "Admin / Kasir"}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="hidden size-4 text-slate-500 sm:block"
            />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            collisionPadding={8}
            className="z-50 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-primary">
                {user.role === "OWNER" ? "Owner" : "Admin / Kasir"}
              </p>
            </div>
            <DropdownMenu.Item asChild>
              <Link
                href="/admin/profile"
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50"
              >
                <UserRound aria-hidden="true" className="size-4" />
                Profil saya
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                logoutFormRef.current?.requestSubmit();
              }}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-rose-700 outline-none hover:bg-rose-50 focus:bg-rose-50"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Keluar
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <form ref={logoutFormRef} action={signOutAction} hidden />
    </>
  );
}
