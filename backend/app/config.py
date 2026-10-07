"""All configuration comes from the environment. Never hardcode secrets (SDK rule)."""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- runtime ---
    # dev    : no identity provider; a fixed dev principal. NEVER use in production.
    # appext : NaLamKI Application SDK (OIDC + PKCE, token exchange, CSRF, CSP)
    auth_mode: Literal["dev", "appext"] = "dev"
    manifest_path: str = "extension.toml"
    static_dir: str = "dist"
    legacy_engine_url: str = "http://127.0.0.1:3001"   # Express domain engine (strangler-fig, see docs/TODO.md)

    # --- digital farm API (AgriFoodData) ---
    # In appext mode the base URL comes from APPEXT_SERVICE_FARM_URL (set by the auth bundle).
    farm_api_base_url: str = ""
    farm_api_token: str = ""          # dev only; in appext mode tokens come from token exchange

    # --- Db2 vector store (langchain-db2) ---
    db2_database: str = ""
    db2_host: str = ""
    db2_port: str = "50000"
    db2_username: str = ""
    db2_password: str = ""
    db2_security: bool = False        # True for SSL (usually port 50001 / Db2 on Cloud)
    db2_rag_table: str = "CIRQ_KNOWLEDGE"
    rag_max_distance: float = 0.65    # cosine distance; ABOVE this a chunk is not used. Tune on real data.
    rag_top_k: int = 5

    # --- LLM / embeddings ---
    llm_provider: Literal["ollama", "gemini", "watsonx"] = "ollama"
    # Ollama settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_embedding_model: str = "nomic-embed-text"
    ollama_chat_model: str = "llama3.2"
    # Gemini settings
    gemini_api_key: str = ""
    embedding_model: str = "models/gemini-embedding-001"
    chat_model: str = "gemini-2.5-flash"
    # watsonx settings
    watsonx_url: str = ""
    watsonx_apikey: str = ""
    watsonx_project_id: str = ""
    watsonx_embedding_model: str = "ibm/slate-125m-english-rtrvr-v2"
    watsonx_chat_model: str = "ibm/granite-3-8b-instruct"

    # --- ingestion ---
    corpus_dir: str = "backend/corpus"

    @property
    def db2_configured(self) -> bool:
        return all([self.db2_database, self.db2_host, self.db2_username, self.db2_password])

    @property
    def llm_configured(self) -> bool:
        if self.llm_provider == "ollama":
            return bool(self.ollama_base_url and self.ollama_chat_model and self.ollama_embedding_model)
        if self.llm_provider == "gemini":
            return bool(self.gemini_api_key)
        return all([self.watsonx_url, self.watsonx_apikey, self.watsonx_project_id])


@lru_cache
def get_settings() -> Settings:
    return Settings()
