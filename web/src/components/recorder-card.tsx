"use client";

import { useEffect, useRef, useState } from "react";

import { MicrophoneIcon } from "./icons";

type RecorderStatus = "idle" | "recording" | "stopped";

const statusLabels: Record<RecorderStatus, string> = {
  idle: "Mikrofon nicht aktiv",
  recording: "Aufnahme läuft",
  stopped: "Aufnahme beendet",
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Der Mikrofonzugriff wurde abgelehnt. Bitte erlaube den Zugriff in den Browser-Einstellungen.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Es wurde kein Mikrofon gefunden. Bitte schließe ein Mikrofon an und versuche es erneut.";
    }
  }

  return "Das Mikrofon konnte nicht gestartet werden. Bitte überprüfe dein Gerät und versuche es erneut.";
}

interface RecorderCardProps {
  onRecordingReady: (recording: Blob) => Promise<void>;
  onReset: () => void;
}

export function RecorderCard({ onRecordingReady, onReset }: RecorderCardProps) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const stopTimer = (): void => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const revokeAudioUrl = (): void => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  useEffect(() => {
    // React Strict Mode runs an extra setup/cleanup cycle in development.
    // Reset the flag in setup so async microphone permission requests are not
    // mistaken for responses received after the component was unmounted.
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const handleStart = async (): Promise<void> => {
    setErrorMessage(null);
    setIsStarting(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Mikrofonaufnahmen werden von diesem Browser nicht unterstützt (getUserMedia fehlt).");
      setIsStarting(false);
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setErrorMessage("Mikrofonaufnahmen werden von diesem Browser nicht unterstützt (MediaRecorder fehlt).");
      setIsStarting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (error) {
        stopStream();
        throw error;
      }

      revokeAudioUrl();
      setAudioUrl(null);
      chunksRef.current = [];
      setChunkCount(0);
      setElapsedSeconds(0);

      recorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          if (isMountedRef.current) setChunkCount(chunksRef.current.length);
        }
      };

      recorder.onstop = (): void => {
        if (!isMountedRef.current || chunksRef.current.length === 0) return;
        const recording = new Blob(chunksRef.current, {
          type: recorder.mimeType || chunksRef.current[0].type || "audio/webm",
        });
        const url = URL.createObjectURL(recording);
        revokeAudioUrl();
        audioUrlRef.current = url;
        setAudioUrl(url);
        void onRecordingReady(recording);
      };

      recorder.onerror = (): void => {
        if (isMountedRef.current) {
          setErrorMessage("Während der Aufnahme ist ein Fehler aufgetreten.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setStatus("recording");
      setIsStarting(false);

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } catch (error) {
      stopTimer();
      stopStream();
      mediaRecorderRef.current = null;
      setStatus("idle");
      setIsStarting(false);
      setErrorMessage(microphoneErrorMessage(error));
    }
  };

  const handleStop = (): void => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stopStream();
    setStatus("stopped");
  };

  const handleReset = (): void => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    if (recorder) recorder.onstop = null;
    mediaRecorderRef.current = null;
    stopStream();
    revokeAudioUrl();
    chunksRef.current = [];
    setAudioUrl(null);
    setChunkCount(0);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus("idle");
    onReset();
  };

  const isRecording = status === "recording";
  const formattedDuration = formatDuration(elapsedSeconds);

  return (
    <section aria-labelledby="recorder-heading" className="flex min-h-[430px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-card sm:p-10">
      <h2 id="recorder-heading" className="sr-only">Aufnahme</h2>
      <div className="relative mb-7">
        <div className={`absolute inset-0 scale-125 rounded-full ${isRecording ? "animate-pulse bg-red-100" : "bg-accent-50"}`} />
        <div className={`relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-lg transition-colors ${isRecording ? "bg-red-500 shadow-red-500/30" : "bg-accent-500 shadow-accent-500/20"}`}>
          <MicrophoneIcon className="h-14 w-14" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">Aufnahmezeit</p>
      <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-ink" aria-label={`Aufnahmezeit ${formattedDuration}`}>{formattedDuration}</p>
      <div className="mt-5 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600" role="status">
        <span className={`h-2 w-2 rounded-full ${isRecording ? "animate-pulse bg-red-500" : "bg-slate-400"}`} />
        {statusLabels[status]}
      </div>
      <p className="mt-3 text-sm text-slate-500">Audioabschnitte: <span className="font-semibold text-ink">{chunkCount}</span></p>
      {errorMessage && <p className="mt-4 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</p>}
      {audioUrl && (
        <audio className="mt-5 w-full max-w-md" controls src={audioUrl}>
          Dein Browser unterstützt die Audiowiedergabe nicht.
        </audio>
      )}
      <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
        <button type="button" onClick={handleStart} disabled={isRecording || isStarting} className="rounded-xl bg-accent-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isStarting ? "Mikrofon wird aktiviert …" : "Aufnahme starten"}</button>
        <button type="button" onClick={handleStop} disabled={!isRecording} className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Aufnahme stoppen</button>
        <button type="button" onClick={handleReset} disabled={isRecording || (status === "idle" && chunkCount === 0 && !audioUrl && !errorMessage)} className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:col-span-2">Neue Aufnahme</button>
      </div>
    </section>
  );
}
