"use client";

import { SettingsIcon } from "./icons";

export function Header() {
  const handleSettings = (): void => {};

  return (
    <header className="flex items-start justify-between gap-6">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-700">
          <span className="h-2 w-2 rounded-full bg-accent-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Live Speech to Text</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Verwandle gesprochene Worte in Text – direkt, übersichtlich und ganz in deinem Tempo.
        </p>
      </div>
      <button type="button" onClick={handleSettings} aria-label="Einstellungen öffnen" className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-accent-100 hover:bg-accent-50 hover:text-accent-700">
        <SettingsIcon className="h-6 w-6" />
      </button>
    </header>
  );
}
