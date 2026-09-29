import { Sidebar } from "@/components/admin/sidebar";
import { ProfileMenu } from "@/components/admin/profile-menu";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:ml-64 lg:h-[68px] lg:px-8">
          <p className="hidden min-w-0 truncate text-sm text-slate-500 sm:block">
            Ruang kerja <span className="mx-1.5 text-slate-300">/</span>{" "}
            <span className="font-medium text-slate-800">{user.name}</span>
          </p>
          <p className="hidden text-xs font-medium text-slate-500 lg:block">
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "full",
              timeZone: "Asia/Jakarta",
            }).format(new Date())}
          </p>
          <ProfileMenu user={user} />
      </header>
      <Sidebar user={user} />
      <div className="min-h-screen lg:pl-64">
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
