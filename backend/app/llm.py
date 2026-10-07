"""Embeddings + chat model factories. Providers are swappable via LLM_PROVIDER."""
from __future__ import annotations

from functools import lru_cache

from .config import get_settings
from .errors import NotConfigured


@lru_cache
def get_embeddings():
    s = get_settings()
    if not s.llm_configured:
        raise NotConfigured("The embedding model", "Set OLLAMA_BASE_URL (or GEMINI_API_KEY / WATSONX_* with LLM_PROVIDER).")
    if s.llm_provider == "ollama":
        from langchain_ollama import OllamaEmbeddings

        return OllamaEmbeddings(
            base_url=s.ollama_base_url,
            model=s.ollama_embedding_model,
        )
    if s.llm_provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        return GoogleGenerativeAIEmbeddings(model=s.embedding_model, google_api_key=s.gemini_api_key)
    from langchain_ibm import WatsonxEmbeddings

    return WatsonxEmbeddings(
        model_id=s.watsonx_embedding_model, url=s.watsonx_url,
        apikey=s.watsonx_apikey, project_id=s.watsonx_project_id,
    )


@lru_cache
def get_chat_model():
    s = get_settings()
    if not s.llm_configured:
        raise NotConfigured("The chat model", "Set OLLAMA_BASE_URL (or GEMINI_API_KEY / WATSONX_* with LLM_PROVIDER).")
    if s.llm_provider == "ollama":
        from langchain_ollama import ChatOllama

        return ChatOllama(
            base_url=s.ollama_base_url,
            model=s.ollama_chat_model,
            temperature=0.1,
        )
    if s.llm_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(model=s.chat_model, google_api_key=s.gemini_api_key, temperature=0.1)
    from langchain_ibm import ChatWatsonx

    return ChatWatsonx(
        model_id=s.watsonx_chat_model, url=s.watsonx_url, apikey=s.watsonx_apikey,
        project_id=s.watsonx_project_id, params={"temperature": 0.1},
    )
