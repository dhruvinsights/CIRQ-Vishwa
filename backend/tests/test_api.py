"""Runs in dev auth mode with no Db2/LLM. Proves: honest 503s, no fabricated values, auth wiring."""
import os

os.environ.update(AUTH_MODE="dev", LEGACY_ENGINE_URL="http://127.0.0.1:9", LLM_PROVIDER="ollama")  # nothing listens on :9

from backend.app.config import get_settings  # noqa: E402
get_settings.cache_clear()

from fastapi.testclient import TestClient  # noqa: E402

from backend.app.main import app  # noqa: E402

client = TestClient(app)


def test_healthz_is_public():
    assert client.get("/healthz").json() == {"status": "ok"}


def test_services_are_real_not_canned():
    ids = {s["id"] for s in client.get("/api/v1/ai/services").json()["services"]}
    assert ids == {"srv-knowledge-assistant", "srv-semantic-resolver"}


def test_rag_without_credentials_is_503_not_fake_answer():
    # Db2 is not configured in test environment
    r = client.post("/api/v1/ai/ask", json={"question": "biochar yield?"})
    assert r.status_code == 503 and r.json()["error"]["code"] == "NOT_CONFIGURED"


def test_integration_sync_not_implemented_is_501():
    r = client.post("/api/v1/integrations/int-copernicus/sync")
    assert r.status_code == 501


def test_data_sources_never_claim_unmeasured_numbers():
    for s in client.get("/api/v1/data/sources").json()["sources"]:
        assert s["records"] == 0 and s["qualityScore"] == 0


def test_legacy_proxy_down_is_502():
    assert client.get("/api/v1/resources").status_code == 502


def test_settings_llm_defaults_to_ollama():
    r = client.get("/api/v1/settings/llm")
    assert r.status_code == 200
    data = r.json()
    assert data["llmProvider"] == "ollama"
    assert "ollama" in data
    assert data["ollama"]["chatModel"] == "llama3.2"
    assert data["ollama"]["embeddingModel"] == "nomic-embed-text"
