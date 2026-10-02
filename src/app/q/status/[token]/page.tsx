import { PublicQueueStatus } from "@/components/public-queue-status";

type PageProps = { params: Promise<{ token: string }> };

export default async function QueueStatusPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <main className="min-h-screen bg-[#f3f7f5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight text-[#24483c]">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#176b5b] text-sm font-black text-white">
            a.
          </span>
          status antrean
        </div>
        <PublicQueueStatus token={token} />
        <p className="mt-5 text-center text-[10px] text-[#a0aaa6]">
          Halaman ini diperbarui otomatis setiap beberapa detik.
        </p>
      </div>
    </main>
  );
}
