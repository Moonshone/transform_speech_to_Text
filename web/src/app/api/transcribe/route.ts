import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
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
  openAiFormData.append("model", "gpt-4o-mini-transcribe");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openAiFormData,
    });

    if (!response.ok) {
      console.error("OpenAI transcription failed:", response.status, await response.text());
      return NextResponse.json({ error: "Der Audiodienst konnte die Aufnahme nicht transkribieren. Bitte versuche es erneut." }, { status: 502 });
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
