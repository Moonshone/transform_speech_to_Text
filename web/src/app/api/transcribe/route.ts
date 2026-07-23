import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_AUDIO_SIZE = 20 * 1024 * 1024;
const SUPPORTED_AUDIO_EXTENSIONS = new Set(["webm", "wav", "mp3", "m4a", "mp4", "ogg", "flac"]);

interface OpenAIErrorDetails {
  code?: string;
  message?: string;
  type?: string;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseOpenAIError(responseBody: string): OpenAIErrorDetails {
  try {
    const parsed: unknown = JSON.parse(responseBody);
    if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
      const error = parsed.error;
      if (typeof error === "object" && error !== null) {
        return {
          code: stringValue("code" in error ? error.code : undefined),
          message: stringValue("message" in error ? error.message : undefined),
          type: stringValue("type" in error ? error.type : undefined),
        };
      }
    }
  } catch {
    // Some upstream and proxy errors are plain text rather than JSON.
  }

  return { message: responseBody.trim() || undefined };
}

function transcriptionError(status: number, details: OpenAIErrorDetails): string {
  if (status === 401) {
    return "Der OpenAI-API-Schlüssel ist ungültig oder wurde deaktiviert.";
  }

  if (status === 429 && (details.code === "insufficient_quota" || details.type === "insufficient_quota")) {
    return "Für das OpenAI-API-Konto ist kein Guthaben verfügbar oder die Abrechnung ist nicht eingerichtet.";
  }

  if (status === 429) {
    return "Das API-Limit wurde vorübergehend erreicht. Bitte versuche es später.";
  }

  if (status === 400) {
    return "Die Audiodatei konnte nicht verarbeitet werden. Bitte erstelle eine neue kurze Aufnahme.";
  }

  if (status === 403) {
    return "Das API-Projekt besitzt keine Berechtigung für dieses Modell.";
  }

  return "Der Transkriptionsdienst hat einen unerwarteten Fehler gemeldet.";
}

function isSupportedAudioFile(audio: File): boolean {
  if (audio.type.toLowerCase().startsWith("audio/")) return true;

  const extension = audio.name.split(".").pop()?.toLowerCase();
  return extension !== undefined && SUPPORTED_AUDIO_EXTENSIONS.has(extension);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Die Transkription ist serverseitig nicht konfiguriert." }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Die Anfrage enthält keine gültigen Formulardaten." }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Bitte sende eine Audiodatei im Feld „audio“." }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "Die Audiodatei ist leer. Bitte erstelle eine neue Aufnahme." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: "Die Audiodatei darf nicht größer als 20 MB sein." }, { status: 413 });
  }
  if (!isSupportedAudioFile(audio)) {
    return NextResponse.json(
      { error: "Das Audioformat wird nicht unterstützt. Bitte verwende WebM, WAV, MP3, M4A, MP4, OGG oder FLAC." },
      { status: 400 },
    );
  }

  const openAiFormData = new FormData();
  openAiFormData.append("file", audio, audio.name || "aufnahme.webm");
  openAiFormData.append("model", "gpt-4o-mini-transcribe");
  openAiFormData.append("language", "de");
  openAiFormData.append("response_format", "json");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openAiFormData,
    });

    if (!response.ok) {
      const details = parseOpenAIError(await response.text());
      const requestId = response.headers.get("x-request-id") ?? undefined;
      console.error("OpenAI transcription failed", {
        status: response.status,
        type: details.type,
        code: details.code,
        message: details.message,
        "x-request-id": requestId,
      });
      return NextResponse.json({ error: transcriptionError(response.status, details) }, { status: response.status });
    }

    const result = (await response.json()) as { text?: unknown };
    if (typeof result.text !== "string") {
      return NextResponse.json({ error: "Der Audiodienst hat kein gültiges Transkript zurückgegeben." }, { status: 502 });
    }

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("OpenAI transcription request failed", {
      message: error instanceof Error ? error.message : "Unknown request error",
    });
    return NextResponse.json({ error: "Der Audiodienst ist derzeit nicht erreichbar. Bitte versuche es erneut." }, { status: 502 });
  }
}
