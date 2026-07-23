from streamlit.testing.v1 import AppTest


def test_app_starts_without_audio() -> None:
    app = AppTest.from_file("app.py").run()

    assert not app.exception
    assert len(app.get("file_uploader")) == 1
