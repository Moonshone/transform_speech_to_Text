/// <reference lib="webworker" />

import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const MODEL = "onnx-community/whisper-tiny";
let transcriberPromise: Promise<{ transcriber: AutomaticSpeechRecognitionPipeline; backend: "webgpu" | "wasm" }> | null = null;

function post(message: object): void { scope.postMessage(message); }

async function loadModel(id: number) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const progress_callback = (event: { status?: string; progress?: number }): void => {
        if (event.status === "progress") post({ type: "loading", id, progress: event.progress });
      };
      if ("gpu" in navigator) {
        try {
          const transcriber = await pipeline("automatic-speech-recognition", MODEL, { device: "webgpu", progress_callback });
          return { transcriber, backend: "webgpu" as const };
        } catch { /* Fall back to broadly supported WASM. */ }
      }
      try {
        const transcriber = await pipeline("automatic-speech-recognition", MODEL, { device: "wasm", progress_callback });
        return { transcriber, backend: "wasm" as const };
      } catch (error) {
        transcriberPromise = null;
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Das Modell konnte weder mit WebGPU noch mit WASM geladen werden. ${detail}`);
      }
    })();
  }
  return transcriberPromise;
}

scope.onmessage = async ({ data }: MessageEvent<{ type: string; id: number; audio: Float32Array }>) => {
  if (data.type === "dispose") { scope.close(); return; }
  if (data.type !== "transcribe") return;
  try {
    post({ type: "loading", id: data.id });
    const { transcriber, backend } = await loadModel(data.id);
    post({ type: "ready", id: data.id, backend });
    post({ type: "transcribing", id: data.id });
    const result = await transcriber(data.audio, { language: "de", task: "transcribe" });
    const text = Array.isArray(result) ? result.map((item) => item.text).join(" ") : result.text;
    post({ type: "result", id: data.id, text: text.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    const memoryHint = /memory|allocation|out of bounds/i.test(message) ? " Möglicherweise steht zu wenig Gerätespeicher zur Verfügung." : "";
    post({ type: "error", id: data.id, message: `Transkription fehlgeschlagen: ${message}${memoryHint}` });
  }
};

export {};
