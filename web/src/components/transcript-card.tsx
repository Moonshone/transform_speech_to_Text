"use client";

import { useState, type ReactNode } from "react";
import { CopyIcon, DownloadIcon, EmailIcon, TrashIcon } from "./icons";
import { EmailTranscriptDialog } from "./email-transcript-dialog";
import { detectedLanguageLabels, type DetectedLanguage, type SupportedLanguage } from "../types/languages";

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ label, icon, onClick, disabled = false }: ActionButtonProps) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent-100 hover:bg-accent-50 hover:text-accent-700 disabled:cursor-not-allowed disabled:opacity-50">{icon}{label}</button>;
}

interface TranscriptCardProps {
  language: SupportedLanguage;
  detectedLanguage: DetectedLanguage;
  text: string;
  isTranscribing: boolean;
  source: "Mikrofon" | "Upload" | null;
  status?: string;
  error: string | null;
  onClear: () => void;
}

export function TranscriptCard({ language, detectedLanguage, text, isTranscribing, source, status, error, onClear }: TranscriptCardProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isPersian = detectedLanguage === "fa" || (detectedLanguage === null && language === "fa");

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(text);
  };

  const handleDownload = (): void => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "transkript.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="transcript-heading" className="flex min-h-[430px] flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent-700">TRANSKRIPTION</p>
          <h2 id="transcript-heading" className="mt-1 text-2xl font-bold tracking-tight text-ink">Erkannter Text</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">{source ? `${source} · ` : ""}{wordCount} {wordCount === 1 ? "Wort" : "Wörter"}</span>
      </div>
      {isTranscribing && <p className="mb-4 rounded-xl bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700" role="status">{status ?? "Transkription läuft …"}</p>}
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <p className="mb-3 text-sm font-medium text-slate-600">Erkannte Sprache: {detectedLanguage ? detectedLanguageLabels[detectedLanguage] : "Unbekannt"}</p>
      <label htmlFor="transcript" className="sr-only">Erkannter Text</label>
      <textarea id="transcript" dir={isPersian ? "rtl" : "ltr"} readOnly value={text} placeholder="Dein gesprochener Text erscheint während der Aufnahme hier." className={`min-h-52 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-ink placeholder:text-slate-400 ${isPersian ? "text-right" : "text-left"}`} />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionButton label="Kopieren" icon={<CopyIcon className="h-4 w-4" />} onClick={handleCopy} disabled={!text} />
        <ActionButton label="Löschen" icon={<TrashIcon className="h-4 w-4" />} onClick={onClear} disabled={!text && !error} />
        <ActionButton label="Als TXT speichern" icon={<DownloadIcon className="h-4 w-4" />} onClick={handleDownload} disabled={!text} />
        <ActionButton label="Per E-Mail senden" icon={<EmailIcon className="h-4 w-4" />} onClick={() => setEmailOpen(true)} disabled={!text || !source} />
      </div>
      {source && <EmailTranscriptDialog open={emailOpen} onClose={() => setEmailOpen(false)} text={text} source={source} language={detectedLanguage ? detectedLanguageLabels[detectedLanguage] : language === "auto" ? "Unbekannt" : detectedLanguageLabels[language]} />}
    </section>
  );
}
