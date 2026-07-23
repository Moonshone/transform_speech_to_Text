import { Header } from "@/components/header";
import { RecorderCard } from "@/components/recorder-card";
import { StatusBar } from "@/components/status-bar";
import { TranscriptCard } from "@/components/transcript-card";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Header />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RecorderCard />
        <TranscriptCard />
      </div>
      <div className="mt-6"><StatusBar /></div>
      <p className="mt-8 text-center text-xs text-slate-400">Lokale Audioaufnahme · Keine Audiodaten werden versendet</p>
    </main>
  );
}
