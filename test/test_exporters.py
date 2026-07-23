from src.exporters import _format_srt_time, segments_to_srt
from src.transcriber import TranscriptSegment


def test_format_srt_time() -> None:
    assert _format_srt_time(3_661.234) == "01:01:01,234"


def test_segments_to_srt() -> None:
    segments = [
        TranscriptSegment(start=0.0, end=1.5, text="Hallo Welt"),
        TranscriptSegment(start=2.0, end=3.25, text="Zweiter Satz"),
    ]

    assert segments_to_srt(segments) == (
        "1\n00:00:00,000 --> 00:00:01,500\nHallo Welt\n\n"
        "2\n00:00:02,000 --> 00:00:03,250\nZweiter Satz\n"
    )


def test_segments_to_srt_with_no_segments() -> None:
    assert segments_to_srt([]) == ""
