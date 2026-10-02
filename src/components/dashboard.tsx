"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Users2,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FeatureKey, MembershipRole, QueueStatus } from "@prisma/client";
import { FeatureSettings } from "@/components/feature-settings";
import { AccessLinks } from "@/components/access-links";

type QueueRow = {
  id: string;
  ticketNumber: string;
  status: QueueStatus;
  issuedAt: string;
  serviceName: string;
  serviceCode: string;
  counterName: string | null;
  customerName: string;
};

type BranchData = {
  id: string;
  name: string;
  timezone: string;
  services: { id: string; name: string; code: string }[];
  counters: {
    id: string;
    name: string;
    code: string;
    currentTicket: string | null;
    currentService: string | null;
    queueStatus: QueueStatus | null;
  }[];
};

type DashboardProps = {
  businessName: string;
  businessSlug: string;
  branch: BranchData;
  role: MembershipRole;
  userName: string;
  enabledFeatures: FeatureKey[];
  metrics: {
    total: number;
    waiting: number;
    active: number;
    completed: number;
    averageWaitMinutes: number;
    averageServiceMinutes: number;
  };
  queues: QueueRow[];
};

const queueActionLabels: Record<string, string> = {
  recall: "Panggil ulang",
  start: "Mulai layanan",
  complete: "Selesaikan",
  skip: "Lewati",
  "no-show": "Tidak hadir",
  "return-to-waiting": "Kembalikan ke antrean",
  cancel: "Batalkan",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortName(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Dashboard({
  businessName,
  businessSlug,
  branch,
  role,
  userName,
  enabledFeatures,
  metrics,
  queues,
}: DashboardProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const canOperate = role === "ADMIN" || role === "SUPER_ADMIN";
  const canConfigure = role === "SUPER_ADMIN";
  const isOwner = role === "OWNER";
  const analyticsEnabled =
    enabledFeatures.includes("ANALYTICS") &&
    (isOwner || role === "SUPER_ADMIN");

  async function callNext(counterId: string) {
    setBusyAction(`call-${counterId}`);
    setNotice("");
    try {
      const response = await fetch(`/api/v1/businesses/${businessSlug}/queues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch.id, counterId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal memanggil antrean.");
      setNotice(`${result.data.ticketNumber} dipanggil ke loket.`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setBusyAction(null);
    }
  }

  async function runQueueAction(queueId: string, action: string) {
    setBusyAction(`${action}-${queueId}`);
    setNotice("");
    try {
      const response = await fetch(
        `/api/v1/businesses/${businessSlug}/queues/${queueId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Aksi antrean gagal.");
      setNotice(`Status antrean berhasil diperbarui.`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-[#182321]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-[#e9edeb] bg-white px-4 pb-5 pt-6 xl:flex">
        <div className="flex items-center gap-3 px-3">
          <div className="flex size-10 items-center justify-center rounded-[13px] bg-[#176b5b] text-white shadow-[0_4px_10px_rgba(23,107,91,.2)]">
            <span className="text-lg font-black">a.</span>
          </div>
          <span className="text-lg font-semibold tracking-[-.04em]">antrian</span>
          <button className="ml-auto rounded-lg p-2 text-[#889590] hover:bg-[#f5f7f6]">
            <Command className="size-4" />
          </button>
        </div>

        <button className="mt-9 flex w-full items-center gap-3 rounded-xl border border-[#e9edeb] p-3 text-left transition hover:border-[#cddbd5]">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#edf5f1] text-[#176b5b]">
            <span className="text-xs font-bold">{shortName(businessName)}</span>
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{businessName}</span>
            <span className="mt-0.5 block text-xs text-[#889590]">Workspace</span>
          </span>
          <ChevronDown className="size-4 text-[#9ba6a2]" />
        </button>

        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#9aa5a1]">
          Workspace
        </p>
        <nav className="space-y-1">
          <NavLink href="#overview" label="Ringkasan" icon={LayoutDashboard} active />
          <NavLink href="#queue" label="Antrean" icon={Users2} badge={metrics.waiting} />
          <NavLink href="#counters" label="Loket" icon={Radio} />
          {analyticsEnabled && (
            <NavLink href="#services" label="Layanan" icon={Activity} />
          )}
        </nav>

        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#9aa5a1]">
          Pengelolaan
        </p>
        <nav className="space-y-1">
          {!canConfigure && !isOwner ? null : (
            <NavLink
              href="#analytics"
              label="Analitik"
              icon={CalendarDays}
              disabled={!enabledFeatures.includes("ANALYTICS")}
            />
          )}
          {canConfigure && <NavLink href="#settings" label="Pengaturan" icon={Settings2} />}
        </nav>
        {!analyticsEnabled && (canConfigure || isOwner) && (
          <p className="mx-3 mt-2 text-[11px] leading-4 text-[#9aa5a1]">
            Analitik dinonaktifkan untuk bisnis ini.
          </p>
        )}

        <div className="mt-auto rounded-2xl bg-[#edf6f2] p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white text-[#176b5b]">
            <Sparkles className="size-[17px]" />
          </div>
          <p className="text-sm font-semibold">Layanan lebih rapi</p>
          <p className="mt-1 text-xs leading-5 text-[#75827f]">
            Satu tempat untuk mengelola antrean dan pelayanan.
          </p>
          <button className="mt-3 text-xs font-semibold text-[#176b5b]">
            Pelajari sistem <span aria-hidden="true">↗</span>
          </button>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#75827f] hover:bg-[#f6f8f7]"
        >
          <LogOut className="size-4" /> Keluar
        </button>
      </aside>

      <section className="xl:pl-[250px]">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#e9edeb] bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#176b5b] text-sm font-black text-white xl:hidden">
              a.
            </div>
            <div className="hidden items-center gap-2 text-sm text-[#9aa5a1] sm:flex">
              <span>Workspace</span>
              <span>/</span>
              <span className="font-medium text-[#344440]">Ringkasan</span>
            </div>
            <div className="sm:hidden">
              <p className="text-[11px] text-[#889590]">{businessName}</p>
              <p className="text-sm font-semibold">{branch.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden h-9 w-[210px] items-center gap-2 rounded-lg border border-[#edf0ef] bg-[#fafbfa] px-3 md:flex">
              <Search className="size-4 text-[#a1aca8]" />
              <span className="flex-1 text-xs text-[#a1aca8]">Cari apa saja...</span>
              <kbd className="rounded border border-[#e7ebe9] bg-white px-1.5 py-0.5 text-[10px] text-[#a1aca8]">
                ⌘ K
              </kbd>
            </div>
            <button className="relative flex size-9 items-center justify-center rounded-lg text-[#75827f] hover:bg-[#f5f7f6]">
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#e47b69]" />
            </button>
            <span className="mx-1 hidden h-7 w-px bg-[#e9edeb] sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold">{userName}</p>
                <p className="mt-0.5 text-[10px] text-[#929e99]">
                  {roleLabel(role)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-[#e7f1ed] text-xs font-bold text-[#276b5b]">
                {shortName(userName)}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#176b5b]">
                <span className="size-1.5 rounded-full bg-[#42a184]" />
                {branch.name}
                <ChevronDown className="size-3.5" />
                <span className="text-[#c0c9c5]">·</span>
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: branch.timezone,
                }).format(new Date())}
              </div>
              <h1 className="text-[26px] font-semibold tracking-[-.04em] sm:text-[30px]">
                Selamat pagi, {userName.split(" ")[0]} <span>👋</span>
              </h1>
              <p className="mt-1.5 text-sm text-[#889590]">
                Pantau operasional dan antrean hari ini.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-10 items-center gap-2 rounded-lg border border-[#e4e9e6] bg-white px-3 text-xs font-medium text-[#56635f] shadow-sm">
                <CalendarDays className="size-4 text-[#889590]" />
                Hari ini
                <ChevronDown className="size-3.5 text-[#9aa5a1]" />
              </button>
              {canOperate && (
                <a
                  href="#queue"
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#176b5b] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#125648]"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Kelola antrean</span>
                  <span className="sm:hidden">Antrean</span>
                </a>
              )}
            </div>
          </div>

          {notice && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between rounded-xl border border-[#cfe5da] bg-[#eff8f3] px-4 py-3 text-sm text-[#176b5b]"
            >
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Tutup pemberitahuan">
                ×
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              title="Total antrean"
              value={metrics.total}
              note="nomor diterbitkan hari ini"
              icon={Users2}
              tone="green"
              trend="Hari berjalan"
            />
            <MetricCard
              title="Menunggu"
              value={metrics.waiting}
              note="pelanggan dalam antrean"
              icon={Clock3}
              tone="amber"
              trend="Perlu dipantau"
            />
            <MetricCard
              title="Sedang dilayani"
              value={metrics.active}
              note="antrean di loket"
              icon={Activity}
              tone="blue"
              trend="Saat ini"
            />
            <MetricCard
              title="Selesai"
              value={metrics.completed}
              note="pelayanan dituntaskan"
              icon={CheckCheck}
              tone="violet"
              trend="Hari ini"
            />
          </div>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.9fr)]">
            <section
              id="overview"
              className="rounded-2xl border border-[#e9edeb] bg-white p-5 shadow-[0_2px_8px_rgba(25,48,40,.025)] md:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-.02em]">
                    Aktivitas antrean
                  </h2>
                  <p className="mt-1 text-xs text-[#929e99]">
                    Distribusi tiket hari ini berdasarkan jam
                  </p>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-[#edf0ef] px-3 py-2 text-[11px] font-medium text-[#687570]">
                  Hari ini <ChevronDown className="size-3.5 text-[#9aa5a1]" />
                </button>
              </div>
              {analyticsEnabled ? (
                <>
                  <QueueActivityChart queues={queues} timezone={branch.timezone} />
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#eff2f0] pt-4 sm:grid-cols-4">
                    <TinyMetric label="Rata-rata waktu tunggu" value={`${metrics.averageWaitMinutes} mnt`} icon={Clock3} />
                    <TinyMetric label="Rata-rata pelayanan" value={`${metrics.averageServiceMinutes} mnt`} icon={Activity} />
                    <TinyMetric label="Layanan tersedia" value={branch.services.length.toString()} icon={Sparkles} />
                    <TinyMetric label="Loket aktif" value={branch.counters.length.toString()} icon={Radio} />
                  </div>
                </>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="Analytics dinonaktifkan"
                    description="Hubungi Super Admin untuk mengaktifkan laporan performa."
                  />
                </div>
              )}
            </section>

            <section id="counters" className="rounded-2xl border border-[#e9edeb] bg-white p-5 shadow-[0_2px_8px_rgba(25,48,40,.025)] md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-.02em]">
                    Status loket
                  </h2>
                  <p className="mt-1 text-xs text-[#929e99]">
                    Kondisi pelayanan saat ini
                  </p>
                </div>
                <button aria-label="Opsi status loket" className="rounded-lg p-1.5 text-[#9aa5a1] hover:bg-[#f6f8f7]">
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {branch.counters.map((counter, index) => (
                  <div
                    key={counter.id}
                    className="flex items-center gap-3 rounded-xl border border-[#eff2f0] p-3"
                  >
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${counter.currentTicket ? "bg-[#eaf4ef] text-[#277660]" : "bg-[#f2f4f3] text-[#7c8883]"}`}>
                      {counter.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{counter.name}</p>
                        <span className={`size-1.5 rounded-full ${counter.currentTicket ? "bg-[#4aa782]" : "bg-[#c9d0cd]"}`} />
                      </div>
                      <p className="mt-1 truncate text-xs text-[#929e99]">
                        {counter.currentTicket
                          ? `${counter.currentTicket} · ${counter.currentService}`
                          : "Belum ada pelanggan"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-medium ${counter.currentTicket ? "text-[#277660]" : "text-[#9aa5a1]"}`}>
                        {counter.currentTicket ? "Melayani" : "Tersedia"}
                      </p>
                      {canOperate && !counter.currentTicket && (
                        <button
                          onClick={() => callNext(counter.id)}
                          disabled={busyAction === `call-${counter.id}` || metrics.waiting === 0}
                          className="mt-1 text-[10px] font-semibold text-[#176b5b] hover:underline disabled:opacity-40"
                        >
                          {busyAction === `call-${counter.id}` ? "Memanggil..." : "Panggil berikutnya"}
                        </button>
                      )}
                    </div>
                    {index === 0 && counter.currentTicket && (
                      <Volume2 className="size-4 text-[#9aa5a1]" />
                    )}
                  </div>
                ))}
                {!branch.counters.length && (
                  <EmptyState title="Belum ada loket" description="Tambahkan loket untuk mulai melayani antrean." />
                )}
              </div>
              <a href="#services" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#edf0ef] py-2.5 text-xs font-semibold text-[#596661] hover:bg-[#fafbfa]">
                Lihat semua loket <ArrowUpRight className="size-3.5" />
              </a>
            </section>
          </div>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.9fr)]">
            <section id="queue" className="overflow-hidden rounded-2xl border border-[#e9edeb] bg-white shadow-[0_2px_8px_rgba(25,48,40,.025)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eff2f0] px-5 py-5 md:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold tracking-[-.02em]">Antrean hari ini</h2>
                    <span className="rounded-full bg-[#eff5f2] px-2 py-0.5 text-[10px] font-semibold text-[#397b68]">
                      {queues.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#929e99]">Pantau dan kelola setiap pelanggan</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.refresh()}
                    className="flex size-9 items-center justify-center rounded-lg border border-[#edf0ef] text-[#76827d] hover:bg-[#f8faf9]"
                    aria-label="Muat ulang antrean"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-[#edf0ef] px-3 text-xs font-medium text-[#687570]">
                    Semua status <ChevronDown className="size-3.5" />
                  </button>
                </div>
              </div>
              {queues.length ? (
                <>
                  <div className="hidden grid-cols-[1.2fr_1fr_1.1fr_.8fr_1fr] gap-4 bg-[#fafbfa] px-6 py-3 text-[10px] font-semibold uppercase tracking-[.1em] text-[#a1aca8] md:grid">
                    <span>Nomor antrean</span>
                    <span>Pelanggan</span>
                    <span>Layanan</span>
                    <span>Status</span>
                    <span className="text-right">Aksi</span>
                  </div>
                  <div className="divide-y divide-[#eff2f0]">
                    {queues.map((queue) => (
                      <QueueItem
                        key={queue.id}
                        queue={queue}
                        canOperate={canOperate}
                        busyAction={busyAction}
                        onAction={runQueueAction}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-6 py-10">
                  <EmptyState title="Belum ada antrean hari ini" description="Antrean baru akan tampil di sini setelah nomor diterbitkan." />
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#eff2f0] px-5 py-3.5 text-xs text-[#929e99] md:px-6">
                <span>Menampilkan {queues.length} antrean</span>
                <button className="font-medium text-[#176b5b]">Lihat semua</button>
              </div>
            </section>

            <div className="space-y-5">
              {analyticsEnabled && (
              <section id="services" className="rounded-2xl border border-[#e9edeb] bg-white p-5 shadow-[0_2px_8px_rgba(25,48,40,.025)] md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-.02em]">Layanan populer</h2>
                    <p className="mt-1 text-xs text-[#929e99]">Berdasarkan antrean hari ini</p>
                  </div>
                  <button aria-label="Bantuan layanan populer" className="text-[#a3ada9]">
                    <CircleHelp className="size-4" />
                  </button>
                </div>
                <div className="mt-5 space-y-4">
                  {branch.services.map((service, index) => {
                    const count = queues.filter((queue) => queue.serviceCode === service.code).length;
                    const percentage = queues.length ? Math.round((count / queues.length) * 100) : 0;
                    return (
                      <div key={service.id}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-[#475550]">{service.name}</span>
                          <span className="text-[#929e99]">{count} antrean</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f3f2]">
                          <div
                            className={`h-full rounded-full ${["bg-[#4c9c80]", "bg-[#89bfa9]", "bg-[#b8d9c9]"][index % 3]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!branch.services.length && (
                    <EmptyState title="Belum ada layanan" description="Layanan yang dibuat akan tampil di sini." />
                  )}
                </div>
              </section>
              )}
              {analyticsEnabled && (
              <section id="analytics" className="rounded-2xl bg-[#176b5b] p-5 text-white shadow-[0_8px_20px_rgba(23,107,91,.12)] md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                    <Sparkles className="size-[17px]" />
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-white/80">
                    {enabledFeatures.includes("ANALYTICS") ? "Analytics aktif" : "Analytics nonaktif"}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">Performa pelayanan</h3>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  Ringkasan layanan berdasarkan data yang tercatat hari ini.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-[10px] text-white/65">Rata-rata waktu tunggu</p>
                    <p className="mt-1 text-xl font-semibold">{metrics.averageWaitMinutes} mnt</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-[10px] text-white/65">Selesai dilayani</p>
                    <p className="mt-1 text-xl font-semibold">{metrics.completed}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-white/60">
                  <Check className="size-3.5" />
                  Berdasarkan aktivitas antrean aktual
                </div>
              </section>
              )}
            </div>
          </div>
          {canConfigure && (
            <div className="mt-5 grid gap-5 2xl:grid-cols-2">
              <FeatureSettings
                businessSlug={businessSlug}
                enabledFeatures={enabledFeatures}
              />
              <AccessLinks
                businessSlug={businessSlug}
                branchId={branch.id}
                qrEnabled={enabledFeatures.includes("QR_QUEUE")}
                displayEnabled={enabledFeatures.includes("TV_DISPLAY")}
              />
            </div>
          )}
          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e8ecea] py-5 text-[11px] text-[#a0aaa6] sm:flex-row">
            <span>© 2026 Antrian Management System</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#55ad86]" />
              Data tersimpan dengan aman
              <span className="mx-1">·</span>
              {roleLabel(role)}
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active = false,
  badge,
  disabled = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <a
      href={disabled ? undefined : href}
      aria-disabled={disabled}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${active ? "bg-[#edf5f1] font-semibold text-[#176b5b]" : "text-[#75827f] hover:bg-[#f7f9f8] hover:text-[#344440]"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <Icon className="size-[17px]" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#687570] shadow-sm">
          {badge}
        </span>
      )}
    </a>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
  trend,
}: {
  title: string;
  value: number;
  note: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "blue" | "violet";
  trend: string;
}) {
  const tones = {
    green: "bg-[#eaf5ef] text-[#43886d]",
    amber: "bg-[#fff5e7] text-[#c68a33]",
    blue: "bg-[#edf2fc] text-[#6889c5]",
    violet: "bg-[#f3effb] text-[#8f72be]",
  };
  return (
    <article className="rounded-2xl border border-[#e9edeb] bg-white p-4 shadow-[0_2px_8px_rgba(25,48,40,.025)] md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#75827f]">{title}</p>
        <span className={`flex size-8 items-center justify-center rounded-[10px] ${tones[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-[-.04em]">{value}</p>
          <p className="mt-2 text-[11px] text-[#929e99]">{note}</p>
        </div>
        <span className="mb-0.5 flex items-center gap-1 rounded-full bg-[#f3f7f5] px-2 py-1 text-[9px] font-medium text-[#638d7b]">
          {tone === "amber" ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
          {trend}
        </span>
      </div>
    </article>
  );
}

function TinyMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f7f5] text-[#6f8c80]">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[9px] text-[#9aa5a1]">{label}</p>
        <p className="mt-0.5 text-xs font-semibold text-[#41514b]">{value}</p>
      </div>
    </div>
  );
}

function QueueActivityChart({
  queues,
  timezone,
}: {
  queues: QueueRow[];
  timezone: string;
}) {
  const hours = Array.from({ length: 9 }, (_, index) => index + 7);
  const counts = hours.map((hour) =>
    queues.filter((queue) => {
      const localHour = Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          hourCycle: "h23",
        }).format(new Date(queue.issuedAt)),
      );
      return localHour === hour;
    }).length,
  );
  const max = Math.max(1, ...counts);
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl font-semibold tracking-[-.04em]">{queues.length}</span>
        <span className="rounded-full bg-[#eaf5ef] px-2 py-1 text-[10px] font-medium text-[#43886d]">
          <ArrowUpRight className="mr-0.5 inline size-3" /> antrean
        </span>
      </div>
      <div className="relative h-[172px]">
        <div className="absolute inset-0 flex flex-col justify-between pb-6">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-dashed border-[#edf0ef]" />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-6 top-0 flex items-end justify-around gap-2 px-1">
          {counts.map((count, index) => {
            const height = count ? Math.max(12, (count / max) * 128) : 4;
            return (
              <div key={hours[index]} className="flex h-full flex-1 flex-col items-center justify-end">
                {count > 0 && (
                  <span className="mb-1.5 text-[9px] font-medium text-[#78857f]">{count}</span>
                )}
                <div
                  className={`w-full max-w-[34px] rounded-t-[5px] transition-all ${index === 4 ? "bg-[#176b5b]" : count ? "bg-[#9dccb5]" : "bg-[#ecf1ee]"}`}
                  style={{ height: `${height}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-around">
          {hours.map((hour) => (
            <span key={hour} className="flex-1 text-center text-[9px] text-[#a1aca8]">
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueueItem({
  queue,
  canOperate,
  busyAction,
  onAction,
}: {
  queue: QueueRow;
  canOperate: boolean;
  busyAction: string | null;
  onAction: (queueId: string, action: string) => Promise<void>;
}) {
  const statusLabel: Record<QueueStatus, string> = {
    WAITING: "Menunggu",
    CALLED: "Dipanggil",
    SERVING: "Dilayani",
    COMPLETED: "Selesai",
    SKIPPED: "Dilewati",
    CANCELLED: "Dibatalkan",
    NO_SHOW: "Tidak hadir",
  };
  const statusStyles: Record<QueueStatus, string> = {
    WAITING: "bg-[#fff6e8] text-[#ae7723]",
    CALLED: "bg-[#edf2fc] text-[#5b78b0]",
    SERVING: "bg-[#e9f5ef] text-[#31795d]",
    COMPLETED: "bg-[#f0f3f2] text-[#74817c]",
    SKIPPED: "bg-[#f7f0e9] text-[#9a7150]",
    CANCELLED: "bg-[#fbefef] text-[#bd6e6e]",
    NO_SHOW: "bg-[#f4effb] text-[#856ca9]",
  };
  const availableActions: Record<QueueStatus, string[]> = {
    WAITING: ["skip", "cancel"],
    CALLED: ["recall", "start", "skip", "no-show", "return-to-waiting", "cancel"],
    SERVING: ["complete"],
    COMPLETED: [],
    SKIPPED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  return (
    <article className="flex flex-col gap-3 px-5 py-3.5 transition hover:bg-[#fcfdfc] md:grid md:grid-cols-[1.2fr_1fr_1.1fr_.8fr_1fr] md:items-center md:gap-4 md:px-6">
      <div className="flex items-center justify-between md:justify-start md:gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#edf5f1] text-[10px] font-bold text-[#377861]">
            {shortName(queue.customerName)}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#344440]">{queue.ticketNumber}</p>
            <p className="mt-0.5 text-[10px] text-[#a0aaa6]">{formatTime(queue.issuedAt)}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-medium md:hidden ${statusStyles[queue.status]}`}>
          {statusLabel[queue.status]}
        </span>
      </div>
      <div className="pl-[46px] text-xs text-[#687570] md:pl-0">{queue.customerName}</div>
      <div className="flex items-center justify-between pl-[46px] md:pl-0">
        <span className="text-xs text-[#687570]">{queue.serviceName}</span>
        <span className={`hidden w-fit rounded-full px-2 py-1 text-[10px] font-medium md:inline-flex ${statusStyles[queue.status]}`}>
          {statusLabel[queue.status]}
        </span>
      </div>
      <div className="pl-[46px] text-[10px] text-[#a0aaa6] md:pl-0">
        {queue.counterName ?? "—"}
      </div>
      <div className="flex items-center gap-1.5 pl-[46px] md:justify-end md:pl-0">
        {canOperate &&
          availableActions[queue.status].slice(0, 2).map((action) => (
            <button
              key={action}
              onClick={() => onAction(queue.id, action)}
              disabled={busyAction === `${action}-${queue.id}`}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-semibold transition disabled:opacity-50 ${action === "complete" || action === "start" ? "bg-[#176b5b] text-white hover:bg-[#125648]" : "bg-[#f4f7f5] text-[#687570] hover:bg-[#eaf0ed]"}`}
            >
              {busyAction === `${action}-${queue.id}`
                ? "..."
                : action === "complete"
                  ? "Selesaikan"
                  : action === "start"
                    ? "Mulai"
                    : queueActionLabels[action]}
            </button>
          ))}
        {canOperate && availableActions[queue.status].length > 2 && (
          <select
            aria-label={`Aksi tambahan untuk ${queue.ticketNumber}`}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                void onAction(queue.id, event.target.value);
                event.target.value = "";
              }
            }}
            className="max-w-24 rounded-lg border border-[#edf0ef] bg-white px-2 py-1.5 text-[10px] text-[#687570]"
          >
            <option value="">Lainnya</option>
            {availableActions[queue.status].slice(2).map((action) => (
              <option key={action} value={action}>
                {queueActionLabels[action]}
              </option>
            ))}
          </select>
        )}
        {!canOperate && <span className="text-[10px] text-[#a0aaa6]">Read-only</span>}
        {queue.status === "COMPLETED" && <Check className="ml-auto size-4 text-[#4d9b79] md:ml-0" />}
      </div>
    </article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#e2e9e5] bg-[#fbfcfb] px-4 py-7 text-center">
      <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#538a73]">
        <Users2 className="size-4" />
      </div>
      <p className="mt-3 text-xs font-semibold text-[#46544f]">{title}</p>
      <p className="mt-1 text-[11px] text-[#98a39f]">{description}</p>
    </div>
  );
}

function roleLabel(role: MembershipRole) {
  const labels: Record<MembershipRole, string> = {
    OWNER: "Owner",
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin Operasional",
  };
  return labels[role];
}
