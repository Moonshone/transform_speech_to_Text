"use client";

import { useRef, useState } from "react";

import { RecorderCard } from "./recorder-card";
import { TranscriptCard } from "./transcript-card";

interface TranscriptionResponse {
  text?: string;
  error?: string;
}

async function readTranscriptionResponse(response: Response): Promise<TranscriptionResponse> {
  const responseBody = await response.text();
  try {
    return JSON.parse(responseBody) as TranscriptionResponse;
  } catch {
    return { error: responseBody || "Die Transkription ist fehlgeschlagen." };
  }
}

function recordingFileName(type: string): string {
  if (type.includes("mp4")) return "aufnahme.m4a";
  if (type.includes("ogg")) return "aufnahme.ogg";
  if (type.includes("mpeg")) return "aufnahme.mp3";
  if (type.includes("wav")) return "aufnahme.wav";
  return "aufnahme.webm";
}

export function SpeechToTextApp() {
  const [text, setText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const clearTranscription = (): void => {
    requestRef.current?.abort();
    requestRef.current = null;
    setText("");
    setError(null);
    setIsTranscribing(false);
  };

  const transcribeRecording = async (recording: Blob): Promise<void> => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setText("");
    setError(null);
    setIsTranscribing(true);

    const formData = new FormData();
    formData.append("audio", recording, recordingFileName(recording.type));

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const result = await readTranscriptionResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Die Transkription ist fehlgeschlagen.");
      }
      setText(result.text ?? "");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Die Transkription ist fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsTranscribing(false);
      }
    }
  };

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <RecorderCard onRecordingReady={transcribeRecording} onReset={clearTranscription} />
      <TranscriptCard text={text} isTranscribing={isTranscribing} error={error} onClear={() => { setText(""); setError(null); }} />
    </div>
  );
}
