import { NextResponse } from "next/server";
import { Resend } from "resend";

const supportedLanguages = new Set([
  "Automatisch",
  "Deutsch",
  "Englisch",
  "Persisch",
  "Französisch",
  "Spanisch",
  "Italienisch",
  "Unbekannt",
]);
const supportedSources = new Set(["Mikrofon", "Upload"]);
const emailPattern = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

type TranscriptRequest = {
  recipient?: unknown;
  subject?: unknown;
  text?: unknown;
  language?: unknown;
  source?: unknown;
};

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function validate(body: TranscriptRequest): string | null {
  if (typeof body.recipient !== "string" || !body.recipient.trim()) return "Bitte gib eine Empfänger-E-Mail-Adresse ein.";
  if (body.recipient.length > 254 || !emailPattern.test(body.recipient.trim())) return "Bitte gib genau eine gültige Empfänger-E-Mail-Adresse ein.";
  if (typeof body.subject !== "string") return "Bitte gib einen Betreff ein.";
  if (body.subject.length > 150) return "Der Betreff darf höchstens 150 Zeichen lang sein.";
  if (typeof body.text !== "string" || !body.text.trim()) return "Der Transkripttext darf nicht leer sein.";
  if (body.text.length > 50_000) return "Der Transkripttext darf höchstens 50.000 Zeichen lang sein.";
  if (typeof body.source !== "string" || !supportedSources.has(body.source)) return "Die Quelle muss Mikrofon oder Upload sein.";
  if (typeof body.language !== "string" || !supportedLanguages.has(body.language)) return "Die angegebene Sprache wird nicht unterstützt.";
  return null;
}

// Für einen öffentlichen Produktivbetrieb sind zusätzlich persistentes Rate Limiting
// (z. B. pro IP) und, je nach Missbrauchsrisiko, ein CAPTCHA erforderlich.
export async function POST(request: Request) {
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return failure("Die Anfrage enthält kein gültiges JSON.", 400);
  }
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return failure("Die Anfrage enthält keine gültigen Formulardaten.", 400);
  }
  const body = parsedBody as TranscriptRequest;

  const validationError = validate(body);
  if (validationError) return failure(validationError, 400);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TRANSCRIPT_EMAIL_FROM;
  if (!apiKey) return failure("Der E-Mail-Versand ist derzeit nicht konfiguriert.", 503);
  if (!from) return failure("Die Absenderadresse für den E-Mail-Versand ist nicht konfiguriert.", 503);

  const recipient = (body.recipient as string).trim();
  const subject = (body.subject as string).trim() || "Transkript meiner Audioaufnahme";
  const transcript = body.text as string;
  const emailText = `Transkript\n\nQuelle: ${body.source}\nSprache: ${body.language}\n\n--------------------------------\n\n${transcript}\n\n--------------------------------\n\nErstellt mit der Speech-to-Text-Web-App.`;

  try {
    // Der Client wird bewusst erst serverseitig im Handler erstellt.
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: recipient, subject, text: emailText });
    if (error) {
      const statusCode = "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 429 || error.name === "rate_limit_exceeded") {
        return failure("Zu viele E-Mails wurden angefordert. Bitte versuche es später erneut.", 429);
      }
      return failure("Der E-Mail-Dienst hat die Nachricht abgelehnt. Bitte prüfe die Angaben und versuche es erneut.", 502);
    }
    return NextResponse.json({ success: true, message: "Die E-Mail wurde erfolgreich versendet." });
  } catch {
    return failure("Der E-Mail-Dienst ist derzeit nicht erreichbar. Bitte versuche es später erneut.", 502);
  }
}
