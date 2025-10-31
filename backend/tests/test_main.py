from fastapi.testclient import TestClient
from pathlib import Path
import backend.main as main


def test_fastapi_test_endpoint(monkeypatch):
    backend_dir = Path(__file__).resolve().parents[1]
    monkeypatch.chdir(backend_dir)

    client = TestClient(main.app)
    resp = client.get("/test")
    assert resp.status_code == 200
