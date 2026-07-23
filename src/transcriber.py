from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel


@dataclass(frozen=True)
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str
    segments: list[TranscriptSegment]


def transcribe_audio(
    audio_path: str | Path,
    model: WhisperModel,
) -> TranscriptionResult:
    path = Path(audio_path)
    if not path.is_file():
        raise FileNotFoundError(f"Audiodatei nicht gefunden: {path}")

    raw_segments, info = model.transcribe(
        str(path),
        vad_filter=True,
    )

    segments = [
        TranscriptSegment(
            start=float(segment.start),
            end=float(segment.end),
            text=segment.text.strip(),
        )
        for segment in raw_segments
        if segment.text.strip()
    ]

    return TranscriptionResult(
        text=" ".join(segment.text for segment in segments),
        language=info.language,
        segments=segments,
    )
