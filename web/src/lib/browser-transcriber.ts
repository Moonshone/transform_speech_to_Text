export type TranscriberStatus =
  | { type: "loading"; progress?: number }
  | { type: "ready"; backend: "webgpu" | "wasm" }
  | { type: "transcribing"; progress?: number }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

type WorkerResponse = TranscriberStatus & { id?: number };

const SAMPLE_RATE = 16_000;

export class BrowserTranscriber {
  private worker: Worker | null = null;
  private requestId = 0;
  private activeReject: ((reason: Error) => void) | null = null;

  constructor(private readonly onStatus: (status: TranscriberStatus) => void) {}

  async transcribe(file: File): Promise<string> {
    if (this.activeReject) throw new Error("Es läuft bereits eine Transkription.");
    const audio = await prepareAudio(file);
    const worker = this.getWorker();
    const id = ++this.requestId;

    return new Promise<string>((resolve, reject) => {
      this.activeReject = reject;
      const finish = (): void => { this.activeReject = null; };
      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        if (data.id !== undefined && data.id !== id) return;
        this.onStatus(data);
        if (data.type === "result") { finish(); resolve(data.text); }
        if (data.type === "error") { finish(); reject(new Error(data.message)); }
      };
      worker.onerror = () => {
        const error = new Error("Der Transkriptions-Worker wurde unerwartet beendet.");
        this.onStatus({ type: "error", message: error.message });
        finish();
        reject(error);
      };
      worker.postMessage({ type: "transcribe", id, audio }, [audio.buffer]);
    });
  }

  terminate(): void {
    this.activeReject?.(new Error("Die Transkription wurde abgebrochen."));
    this.activeReject = null;
    this.worker?.postMessage({ type: "dispose" });
    this.worker?.terminate();
    this.worker = null;
  }

  private getWorker(): Worker {
    this.worker ??= new Worker(new URL("../workers/whisper.worker.ts", import.meta.url), { type: "module" });
    return this.worker;
  }
}

export async function prepareAudio(file: File): Promise<Float32Array> {
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    if (!decoded.length || !decoded.numberOfChannels || !Number.isFinite(decoded.duration)) {
      throw new Error("Die Datei besitzt keine verwertbare Audiospur.");
    }

    const mono = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const samples = decoded.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) mono[index] += samples[index] / decoded.numberOfChannels;
    }

    if (decoded.sampleRate === SAMPLE_RATE) return mono;
    const outputLength = Math.ceil(decoded.duration * SAMPLE_RATE);
    const offline = new OfflineAudioContext(1, outputLength, SAMPLE_RATE);
    const buffer = offline.createBuffer(1, mono.length, decoded.sampleRate);
    buffer.copyToChannel(mono, 0);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0).slice();
  } catch (error) {
    if (error instanceof Error && error.message === "Die Datei besitzt keine verwertbare Audiospur.") throw error;
    throw new Error("Die Audiodatei konnte nicht dekodiert werden oder enthält keine verwertbare Audiospur.");
  } finally {
    if (context && context.state !== "closed") await context.close();
  }
}
