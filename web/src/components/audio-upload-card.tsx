"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

const MAX_SIZE = 50 * 1024 * 1024;
const extensions = [".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg", ".flac"];
const mimeTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/webm", "audio/ogg", "audio/flac"];

function validate(file: File): string | null {
  if (file.size === 0) return "Die ausgewählte Datei ist leer.";
  if (file.size > MAX_SIZE) return "Die Datei ist größer als das erlaubte Limit von 50 MB.";
  const nameAllowed = extensions.some((extension) => file.name.toLowerCase().endsWith(extension));
  if (!mimeTypes.includes(file.type.toLowerCase()) && !nameAllowed) return "Dieses Dateiformat wird nicht unterstützt. Erlaubt sind MP3, WAV, M4A, MP4, WEBM, OGG und FLAC.";
  if (file.type.startsWith("video/")) return "Videodateien werden nicht unterstützt. Bitte wähle eine Audiodatei mit Audiospur.";
  return null;
}

interface AudioUploadCardProps {
  busy: boolean;
  status: string;
  progress: number | null;
  error: string | null;
  onTranscribe: (file: File) => Promise<void>;
  onError: (message: string | null) => void;
}

export function AudioUploadCard({ busy, status, progress, error, onTranscribe, onError }: AudioUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const selectFile = (selected?: File): void => {
    if (!selected) return;
    const validationError = validate(selected);
    if (validationError) { onError(validationError); return; }
    onError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(selected);
    setAudioUrl(URL.createObjectURL(selected));
  };

  const remove = (): void => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); setFile(null); onError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const drop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!busy) selectFile(event.dataTransfer.files[0]);
  };

  return (
    <section aria-labelledby="upload-heading" className="flex min-h-[430px] flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
      <h2 id="upload-heading" className="text-2xl font-bold tracking-tight text-ink">Audiodatei hochladen</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">MP3, WAV, M4A, MP4, WEBM, OGG oder FLAC, maximal 50 MB</p>
      <div onDragOver={(event) => event.preventDefault()} onDrop={drop} className="mt-5 flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent-200 bg-accent-50/50 p-5 text-center">
        <p className="font-medium text-slate-700">Datei hierher ziehen oder auswählen</p>
        <input ref={inputRef} className="sr-only" type="file" accept={`${mimeTypes.join(",")},${extensions.join(",")}`} onChange={(event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0])} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-accent-700 shadow-sm disabled:opacity-50">Datei auswählen</button>
      </div>
      {file && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="font-semibold text-ink">{file.name}</p><p className="mt-1 text-sm text-slate-500">{(file.size / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 2 })} MB · Audiodatei ausgewählt</p></div>}
      {audioUrl && <audio className="mt-4 w-full" controls src={audioUrl}>Dein Browser unterstützt die Audiowiedergabe nicht.</audio>}
      {(status || error) && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-accent-50 text-accent-700"}`} role={error ? "alert" : "status"}>{error ?? status}{progress !== null ? ` (${Math.round(progress)} %)` : ""}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Beim ersten Start wird das Spracherkennungsmodell heruntergeladen. Dies kann je nach Internetverbindung einige Zeit dauern. Danach kann der Browser das Modell zwischenspeichern.</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Die Transkription wird direkt in deinem Browser verarbeitet. Die ausgewählte Audiodatei wird für diese Funktion nicht an unsere Server gesendet.</p>
      <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
        <button type="button" disabled={busy || !file} onClick={() => file && void onTranscribe(file)} className="rounded-xl bg-accent-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Audio in Text umwandeln</button>
        <button type="button" disabled={busy || !file} onClick={remove} className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50">Datei entfernen</button>
      </div>
    </section>
  );
}
