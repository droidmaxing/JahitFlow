import { Sidebar } from "@/components/admin/sidebar";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="min-h-screen lg:pl-64">
        <header className="no-print sticky top-0 z-20 hidden h-[68px] items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur lg:flex">
          <p className="text-sm text-slate-500">
            Ruang kerja <span className="mx-1.5 text-slate-300">/</span>{" "}
            <span className="font-medium text-slate-800">{user.name}</span>
          </p>
          <p className="text-xs font-medium text-slate-500">
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "full",
              timeZone: "Asia/Jakarta",
            }).format(new Date())}
          </p>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
