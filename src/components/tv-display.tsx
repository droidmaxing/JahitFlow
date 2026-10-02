"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Radio, Volume2 } from "lucide-react";

type DisplayQueue = {
  ticketNumber: string;
  status: string;
  service: string;
  counter: string;
  counterCode: string;
};

type DisplaySnapshot = {
  display: { name: string; branch: string; business: string };
  queues: DisplayQueue[];
  voiceEnabled: boolean;
  advertisementEnabled: boolean;
  cursor: string;
};

export function TvDisplay({
  token,
  snapshot,
}: {
  token: string;
  snapshot: DisplaySnapshot;
}) {
  const [queues, setQueues] = useState(snapshot.queues);
  const [connected, setConnected] = useState(false);
  const [clock, setClock] = useState("");
  const voiceEnabled = useRef(snapshot.voiceEnabled);

  useEffect(() => {
    function updateClock() {
      setClock(
        new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    }
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    const events = new EventSource(
      `/api/v1/public/displays/${token}/events?after=${encodeURIComponent(snapshot.cursor)}`,
    );
    events.onopen = () => setConnected(true);
    events.onerror = () => setConnected(false);
    events.addEventListener("capabilities", (message) => {
      const capabilities = JSON.parse((message as MessageEvent<string>).data) as {
        voiceEnabled: boolean;
      };
      voiceEnabled.current = capabilities.voiceEnabled;
    });
    events.onmessage = (message) => {
      const event = JSON.parse(message.data) as {
        type: string;
        payload: {
          ticketNumber?: string;
          status?: string;
          counterName?: string | null;
          serviceName?: string;
        };
      };
      if (!event.payload.ticketNumber || !event.payload.status) return;
      if (["CALLED", "SERVING"].includes(event.payload.status)) {
        const nextQueue: DisplayQueue = {
          ticketNumber: event.payload.ticketNumber,
          status: event.payload.status,
          counter: event.payload.counterName ?? "—",
          counterCode: "",
          service: event.payload.serviceName ?? "Layanan",
        };
        setQueues((current) =>
          [nextQueue, ...current.filter((queue) => queue.ticketNumber !== nextQueue.ticketNumber)].slice(0, 8),
        );
        if (voiceEnabled.current && event.payload.status === "CALLED" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(
            `Nomor ${nextQueue.ticketNumber}, silakan menuju ${nextQueue.counter}.`,
          );
          utterance.lang = "id-ID";
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setQueues((current) =>
          current.filter((queue) => queue.ticketNumber !== event.payload.ticketNumber),
        );
      }
    };
    return () => {
      window.clearInterval(timer);
      events.close();
    };
  }, [snapshot.cursor, snapshot.voiceEnabled, token]);

  const current = queues.filter((queue) => queue.status === "CALLED");
  const serving = queues.filter((queue) => queue.status === "SERVING");

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#092c27] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-10">
        <div>
          <p className="text-xs font-medium text-[#9fd5c4]">{snapshot.display.business}</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">{snapshot.display.branch}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/75">
            <span className={`size-1.5 rounded-full ${connected ? "bg-[#84e1ab]" : "bg-[#e4ba6e]"}`} />
            {connected ? "Tersambung" : "Menghubungkan"}
          </span>
          <span className="font-mono text-sm tabular-nums text-white/80">{clock}</span>
          <button
            aria-label="Tampilkan fullscreen"
            onClick={() => void document.documentElement.requestFullscreen()}
            className="hidden rounded-lg bg-white/10 p-2 text-white/75 hover:bg-white/15 sm:block"
          >
            <Maximize className="size-4" />
          </button>
        </div>
      </header>

      <section className="grid flex-1 gap-6 px-6 py-8 md:grid-cols-[1.45fr_.75fr] md:px-10 md:py-10">
        <div className="flex flex-col">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-[#a1ccbd]">
            <Radio className="size-4" />
            Nomor dipanggil
          </div>
          {current[0] ? (
            <div className="relative flex min-h-[310px] flex-1 flex-col justify-center overflow-hidden rounded-[28px] bg-[#d6f0e3] px-8 py-8 text-[#123f34] md:px-14">
              <div className="absolute -right-16 -top-28 size-80 rounded-full border border-[#176b5b]/10" />
              <p className="relative text-sm font-medium text-[#52836f]">{current[0].service}</p>
              <p className="relative mt-4 text-[clamp(4rem,13vw,10rem)] font-semibold leading-none tracking-[-.075em]">
                {current[0].ticketNumber}
              </p>
              <div className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#176b5b] px-4 py-2.5 text-sm font-semibold text-white">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-[10px]">
                  {current[0].counterCode || "→"}
                </span>
                {current[0].counter}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[310px] flex-1 flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[.04] text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-[#a1ccbd]">
                <Radio className="size-6" />
              </div>
              <p className="mt-4 text-base font-medium text-white/80">Belum ada panggilan</p>
              <p className="mt-1 text-xs text-white/45">Nomor antrean akan tampil di sini.</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/45">
            <span className="flex items-center gap-1.5">
              <Volume2 className="size-3.5" />
              {snapshot.voiceEnabled ? "Pemanggilan suara aktif" : "Ikuti informasi nomor di layar"}
            </span>
            <span>{snapshot.display.name}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.18em] text-[#a1ccbd]">
                Sedang dilayani
              </p>
              <p className="mt-1 text-[10px] text-white/40">Antrean pada loket aktif</p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/60">
              {serving.length} aktif
            </span>
          </div>
          <div className="space-y-3">
            {serving.map((queue) => (
              <div key={queue.ticketNumber} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.05] p-4">
                <div>
                  <p className="text-lg font-semibold tracking-tight">{queue.ticketNumber}</p>
                  <p className="mt-1 text-[10px] text-white/45">{queue.service}</p>
                </div>
                <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-[#d5e7df]">
                  {queue.counter}
                </span>
              </div>
            ))}
            {!serving.length && (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">
                Belum ada antrean yang sedang dilayani.
              </div>
            )}
          </div>
          <div className="mb-4 mt-8 flex items-center justify-between text-xs">
            <p className="font-medium text-white/80">Panggilan terbaru</p>
            <span className="text-[10px] text-white/40">Live</span>
          </div>
          <div className="space-y-2">
            {current.slice(1, 5).map((queue) => (
              <div key={queue.ticketNumber} className="flex items-center justify-between rounded-xl bg-white/[.045] px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#e0f1e9]">{queue.ticketNumber}</span>
                  <span className="text-[10px] text-white/40">{queue.service}</span>
                </div>
                <span className="text-[10px] text-[#bad8ca]">{queue.counter}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="flex items-center justify-between border-t border-white/10 px-6 py-3.5 text-[10px] text-white/35 md:px-10">
        <span>Harap siapkan nomor antrean saat dipanggil</span>
        <span>Antrian · Layanan lebih nyaman</span>
      </footer>
    </main>
  );
}
