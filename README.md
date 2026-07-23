# Transform Speech to Text

Lokale Speech-to-Text-App mit Python, Streamlit und faster-whisper.

## Funktionen

- Upload von WAV-, MP3-, M4A-, OGG- und FLAC-Dateien
- automatische Spracherkennung
- lokale Transkription mit Whisper
- TXT-Export
- automatische Löschung temporärer Audiodateien

## Installation

```bash
python3.11 -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
streamlit run app.py
```

Beim ersten Start lädt `faster-whisper` das Modell `base` herunter. Die App
führt die Transkription lokal auf der CPU mit `compute_type="int8"` aus und
hält das geladene Modell für weitere Transkriptionen im Streamlit-Cache.

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Projektstruktur

```text
.
├── app.py
├── requirements.txt
├── requirements-dev.txt
├── src/
│   ├── config.py
│   ├── exporters.py
│   └── transcriber.py
└── tests/
    └── test_exporters.py
```
