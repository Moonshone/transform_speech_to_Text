"use client";

import { FormEvent, useRef, useState } from "react";

interface EmailTranscriptDialogProps {
  open: boolean;
  text: string;
  language: string;
  source: "Mikrofon" | "Upload";
  onClose: () => void;
}

export function EmailTranscriptDialog({ open, text, language, source, onClose }: EmailTranscriptDialogProps) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("Transkript meiner Audioaufnahme");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const sendingRef = useRef(false);

  if (!open) return null;

  const close = () => {
    if (sendingRef.current) return;
    setState("idle");
    setError("");
    onClose();
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/send-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, subject, text, language, source }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "E-Mail konnte nicht versendet werden.");
      setRecipient("");
      setState("success");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "E-Mail konnte nicht versendet werden.");
      setState("error");
    } finally {
      sendingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="email-dialog-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <h2 id="email-dialog-title" className="text-2xl font-bold text-ink">Transkript per E-Mail senden</h2>
        <p className="mt-2 text-sm text-slate-600">Der aktuell erkannte Text wird als Inhalt der E-Mail versendet.</p>
        <form className="mt-6 space-y-4" onSubmit={send}>
          <div><label htmlFor="email-recipient" className="block text-sm font-semibold text-slate-700">Empfänger-E-Mail</label><input id="email-recipient" type="email" required maxLength={254} value={recipient} onChange={(event) => setRecipient(event.target.value)} disabled={state === "sending"} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100" /></div>
          <div><label htmlFor="email-subject" className="block text-sm font-semibold text-slate-700">Betreff</label><input id="email-subject" required maxLength={150} value={subject} onChange={(event) => setSubject(event.target.value)} disabled={state === "sending"} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100" /></div>
          <div aria-live="polite">
            {state === "sending" && <p className="text-sm font-medium text-accent-700">E-Mail wird gesendet …</p>}
            {state === "success" && <p className="text-sm font-medium text-emerald-700">E-Mail wurde erfolgreich versendet.</p>}
            {state === "error" && <p role="alert" className="text-sm font-medium text-red-700">E-Mail konnte nicht versendet werden. {error}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} disabled={state === "sending"} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50">Abbrechen</button>
            <button type="submit" disabled={state === "sending" || !recipient.trim()} className="rounded-xl bg-accent-600 px-5 py-3 font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50">{state === "sending" ? "E-Mail wird gesendet …" : "E-Mail senden"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
