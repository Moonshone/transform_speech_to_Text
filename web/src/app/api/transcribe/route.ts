import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface OpenAIErrorResponse {
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
}

function transcriptionError(status: number, details: OpenAIErrorResponse): string {
  if (status === 401 || status === 403) {
    return "Der Audiodienst ist nicht korrekt autorisiert. Bitte prüfe den OPENAI_API_KEY in Vercel.";
  }

  if (status === 429) {
    return "Das Kontingent des Audiodienstes ist aufgebraucht oder gerade ausgelastet. Bitte prüfe das OpenAI-Konto und versuche es später erneut.";
  }

  if (status === 400 && (details.error?.code === "invalid_value" || details.error?.type === "invalid_request_error")) {
    return "Das Audioformat der Aufnahme wurde vom Audiodienst nicht akzeptiert. Bitte nimm einen neuen, mindestens eine Sekunde langen Audioclip auf.";
  }

  return "Der Audiodienst konnte die Aufnahme nicht transkribieren. Bitte versuche es erneut.";
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
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "Bitte sende eine nicht leere Audiodatei im Feld „audio“." }, { status: 400 });
  }

  const openAiFormData = new FormData();
  openAiFormData.append("file", audio, audio.name || "aufnahme.webm");
  openAiFormData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openAiFormData,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      let details: OpenAIErrorResponse = {};
      try {
        details = JSON.parse(responseBody) as OpenAIErrorResponse;
      } catch {
        // Keep the generic message if the upstream response is not JSON.
      }
      console.error("OpenAI transcription failed:", response.status, responseBody);
      return NextResponse.json({ error: transcriptionError(response.status, details) }, { status: 502 });
    }

    const result = (await response.json()) as { text?: unknown };
    if (typeof result.text !== "string") {
      return NextResponse.json({ error: "Der Audiodienst hat kein gültiges Transkript zurückgegeben." }, { status: 502 });
    }

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("OpenAI transcription request failed:", error);
    return NextResponse.json({ error: "Der Audiodienst ist derzeit nicht erreichbar. Bitte versuche es erneut." }, { status: 502 });
  }
}
