import { Header } from "@/components/header";
import { SpeechToTextApp } from "@/components/speech-to-text-app";
import { StatusBar } from "@/components/status-bar";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Header />
      <SpeechToTextApp />
      <div className="mt-6"><StatusBar /></div>
      <p className="mt-8 text-center text-xs text-slate-400">Die Aufnahme wird nach dem Stoppen sicher zur Transkription übertragen.</p>
    </main>
  );
}
