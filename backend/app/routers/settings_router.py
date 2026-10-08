"""System and runtime settings router. Allows inspecting and updating active LLM / embedding configurations."""
from __future__ import annotations

from typing import Literal
import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..auth import user_dep
from ..config import get_settings
from ..errors import ApiError
from ..llm import get_chat_model, get_embeddings
from ..rag.store import backend_type

router = APIRouter(prefix="/settings")


class LLMConfigUpdate(BaseModel):
    llmProvider: Literal["ollama", "gemini", "watsonx"]
    # Ollama
    ollamaBaseUrl: str = Field(default="http://localhost:11434")
    ollamaEmbeddingModel: str = Field(default="nomic-embed-text")
    ollamaChatModel: str = Field(default="llama3.2")
    # Gemini
    geminiApiKey: str = Field(default="")
    embeddingModel: str = Field(default="models/gemini-embedding-001")
    chatModel: str = Field(default="gemini-2.5-flash")
    # watsonx
    watsonxUrl: str = Field(default="")
    watsonxApikey: str = Field(default="")
    watsonxProjectId: str = Field(default="")
    watsonxEmbeddingModel: str = Field(default="ibm/slate-125m-english-rtrvr-v2")
    watsonxChatModel: str = Field(default="ibm/granite-3-8b-instruct")


@router.get("/llm")
async def get_llm_settings(_=Depends(user_dep)):
    s = get_settings()
    return {
        "llmProvider": s.llm_provider,
        "isConfigured": s.llm_configured,
        "ollama": {
            "baseUrl": s.ollama_base_url,
            "embeddingModel": s.ollama_embedding_model,
            "chatModel": s.ollama_chat_model,
        },
        "gemini": {
            "hasApiKey": bool(s.gemini_api_key),
            "embeddingModel": s.embedding_model,
            "chatModel": s.chat_model,
        },
        "watsonx": {
            "url": s.watsonx_url,
            "hasApiKey": bool(s.watsonx_apikey),
            "projectId": s.watsonx_project_id,
            "embeddingModel": s.watsonx_embedding_model,
            "chatModel": s.watsonx_chat_model,
        },
        "productionRecommendation": {
            "provider": "ollama",
            "reason": "Self-hosted Ollama runs on-premise without external data egress or token metering, ensuring zero-vendor-lockin and privacy compliance for enterprise/farm deployments.",
            "recommendedModels": {
                "chat": "llama3.2 (or mistral / qwen2.5)",
                "embedding": "nomic-embed-text (or bge-m3 / mxbai-embed-large)"
            }
        }
    }


@router.post("/llm")
async def update_llm_settings(body: LLMConfigUpdate, user=Depends(user_dep)):
    s = get_settings()
    
    # Update active configuration
    s.llm_provider = body.llmProvider
    s.ollama_base_url = body.ollamaBaseUrl.strip()
    s.ollama_embedding_model = body.ollamaEmbeddingModel.strip()
    s.ollama_chat_model = body.ollamaChatModel.strip()
    
    if body.geminiApiKey:
        s.gemini_api_key = body.geminiApiKey.strip()
    s.embedding_model = body.embeddingModel.strip()
    s.chat_model = body.chatModel.strip()
    
    s.watsonx_url = body.watsonxUrl.strip()
    if body.watsonxApikey:
        s.watsonx_apikey = body.watsonxApikey.strip()
    s.watsonx_project_id = body.watsonxProjectId.strip()
    s.watsonx_embedding_model = body.watsonxEmbeddingModel.strip()
    s.watsonx_chat_model = body.watsonxChatModel.strip()

    # Clear cached factories so subsequent calls use updated provider
    get_embeddings.cache_clear()
    get_chat_model.cache_clear()

    return {
        "status": "UPDATED",
        "llmProvider": s.llm_provider,
        "isConfigured": s.llm_configured,
    }


@router.post("/llm/test-ollama")
async def test_ollama_connection(body: dict | None = None, _=Depends(user_dep)):
    s = get_settings()
    url = (body.get("baseUrl") if body else None) or s.ollama_base_url
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{url.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                models_data = resp.json()
                models = [m.get("name") for m in models_data.get("models", [])]
                return {
                    "status": "ONLINE",
                    "url": url,
                    "availableModels": models,
                    "count": len(models),
                }
            return {
                "status": "ERROR",
                "url": url,
                "statusCode": resp.status_code,
                "message": f"Ollama returned HTTP {resp.status_code}",
            }
    except Exception as exc:
        return {
            "status": "OFFLINE",
            "url": url,
            "message": f"Could not reach Ollama at {url}: {exc.__class__.__name__}",
        }


@router.get("/vector-store")
async def get_vector_store(_=Depends(user_dep)):
    """Return current vector store backend and its status."""
    s = get_settings()
    chunks = None
    status = "NOT_CONFIGURED"
    if s.llm_configured and s.vector_store_configured:
        try:
            from ..rag import store as rag_store
            chunks = await rag_store.count()
            status = "OK"
        except Exception as exc:  # noqa: BLE001
            status = f"ERROR: {type(exc).__name__}"
    return {
        "vectorStore": s.vector_store,
        "chromaPersistDir": s.chroma_persist_dir if s.vector_store == "chroma" else None,
        "db2Configured": s.db2_configured,
        "status": status,
        "chunksIndexed": chunks,
        "availableBackends": ["chroma", "db2"],
    }


@router.post("/vector-store")
async def set_vector_store(body: dict, user=Depends(user_dep)):
    """Switch vector store backend at runtime. Requires re-ingest after switching."""
    backend = str(body.get("vectorStore", "")).lower()
    if backend not in ("chroma", "db2"):
        raise ApiError(422, "VALIDATION", "vectorStore must be 'chroma' or 'db2'")
    s = get_settings()
    if backend == "db2" and not s.db2_configured:
        raise ApiError(503, "NOT_CONFIGURED",
                       "Db2 credentials not set. Configure DB2_DATABASE, DB2_HOST, DB2_USERNAME, DB2_PASSWORD first.")
    s.vector_store = backend  # type: ignore[assignment]
    # Clear LRU caches so next call picks up the new backend
    from ..rag.store import _store
    _store.cache_clear()
    from ..llm import get_embeddings, get_chat_model
    get_embeddings.cache_clear()
    get_chat_model.cache_clear()
    return {"vectorStore": backend, "message": f"Switched to {backend.upper()}. Re-run /knowledge/ingest to populate the new store."}
