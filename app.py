import tempfile
from pathlib import Path

import streamlit as st
from faster_whisper import WhisperModel

from src.config import DEFAULT_COMPUTE_TYPE, DEFAULT_DEVICE, DEFAULT_MODEL_SIZE
from src.transcriber import transcribe_audio


@st.cache_resource(show_spinner=False)
def load_whisper_model() -> WhisperModel:
    """Load the local Whisper model once per Streamlit process."""
    return WhisperModel(
        DEFAULT_MODEL_SIZE,
        device=DEFAULT_DEVICE,
        compute_type=DEFAULT_COMPUTE_TYPE,
    )


st.set_page_config(page_title="Speech to Text", page_icon="🎙️")
st.title("🎙️ Speech-to-Text-App")
st.write("Lade eine Audiodatei hoch und transkribiere sie lokal mit Whisper.")

audio = st.file_uploader(
    "Audiodatei auswählen",
    type=["wav", "mp3", "m4a", "ogg", "flac"],
    help="Unterstützte Formate: WAV, MP3, M4A, OGG und FLAC",
)

if audio is not None:
    st.audio(audio)

    if st.button("Transkription starten", type="primary"):
        suffix = Path(getattr(audio, "name", "recording.wav")).suffix or ".wav"
        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(audio.getvalue())
                temp_path = Path(temp_file.name)

            with st.spinner("Audio wird transkribiert ..."):
                model = load_whisper_model()
                result = transcribe_audio(temp_path, model)

            st.success(f"Erkannte Sprache: {result.language}")
            st.text_area("Transkription", result.text, height=250)

            st.download_button(
                "TXT herunterladen",
                data=result.text,
                file_name="transkription.txt",
                mime="text/plain",
            )
        except Exception as exc:
            st.error(
                "Die Transkription ist fehlgeschlagen. Prüfe das Audioformat "
                f"und versuche es erneut. Technische Details: {exc}"
            )
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()
