"""
Vector store abstraction — supports ChromaDB (local, default) and Db2 12.1.2+ (enterprise).
Switch with VECTOR_STORE=chroma|db2 in .env.  Chroma persists to CHROMA_PERSIST_DIR (.chroma/).

ibm_db connections are not thread-safe, so every call through _lock. For Chroma the lock is
a no-op but kept for API symmetry.
"""
from __future__ import annotations

import asyncio
import threading
from functools import lru_cache

from ..config import get_settings
from ..errors import NotConfigured
from ..llm import get_embeddings

_lock = threading.Lock()


@lru_cache
def _store():
    s = get_settings()
    if s.vector_store == "db2":
        if not s.db2_configured:
            raise NotConfigured(
                "The Db2 vector store",
                "Set DB2_DATABASE, DB2_HOST, DB2_PORT, DB2_USERNAME, DB2_PASSWORD (Db2 12.1.2+), or switch VECTOR_STORE=chroma.",
            )
        try:
            from langchain_db2 import DB2VS
            try:
                from langchain_db2.db2vs import DistanceStrategy
            except ImportError:
                from langchain_community.vectorstores.utils import DistanceStrategy
            return DB2VS(
                embedding_function=get_embeddings(),
                table_name=s.db2_rag_table,
                distance_strategy=DistanceStrategy.COSINE,
                connection_args={
                    "database": s.db2_database,
                    "host": s.db2_host,
                    "port": s.db2_port,
                    "username": s.db2_username,
                    "password": s.db2_password,
                    "security": s.db2_security,
                },
            )
        except ImportError as exc:
            raise NotConfigured(
                "langchain-db2",
                "Run: pip install langchain-db2. Or switch VECTOR_STORE=chroma.",
            ) from exc
    else:
        # ChromaDB — local, no server required
        try:
            from langchain_chroma import Chroma
        except ImportError as exc:
            raise NotConfigured(
                "langchain-chroma",
                "Run: pip install langchain-chroma chromadb",
            ) from exc
        return Chroma(
            collection_name="cirq_knowledge",
            embedding_function=get_embeddings(),
            persist_directory=s.chroma_persist_dir,
        )


def _sync_search(query: str, k: int):
    with _lock:
        store = _store()
        results = store.similarity_search_with_relevance_scores(query, k=k)
        # Normalise: Chroma returns (doc, score) where score is similarity (higher=closer).
        # Db2 returns (doc, distance) where distance is lower=closer (cosine).
        # We convert to distance so chain.py threshold logic is uniform.
        s = get_settings()
        if s.vector_store == "chroma":
            # relevance score 0..1 → distance = 1 - score
            return [(doc, float(1.0 - score)) for doc, score in results]
        return results  # already (doc, cosine_distance)


def _sync_upsert(texts: list[str], metadatas: list[dict], ids: list[str]):
    with _lock:
        store = _store()
        s = get_settings()
        try:
            if s.vector_store == "db2":
                store.delete(ids=ids)
            else:
                store.delete(ids=ids)
        except Exception:  # noqa: BLE001  (first run: nothing to delete)
            pass
        store.add_texts(texts=texts, metadatas=metadatas, ids=ids)


def _sync_count() -> int | None:
    with _lock:
        try:
            s = get_settings()
            store = _store()
            if s.vector_store == "chroma":
                return store._collection.count()
            else:
                cur = store.client.cursor()
                cur.execute(f'SELECT COUNT(*) FROM "{s.db2_rag_table.upper()}"')
                return int(cur.fetchone()[0])
        except Exception:  # noqa: BLE001
            return None


async def search(query: str, k: int):
    """Return [(Document, distance)] — lower distance is closer."""
    return await asyncio.to_thread(_sync_search, query, k)


async def upsert(texts: list[str], metadatas: list[dict], ids: list[str]) -> None:
    await asyncio.to_thread(_sync_upsert, texts, metadatas, ids)


async def count() -> int | None:
    return await asyncio.to_thread(_sync_count)


def backend_type() -> str:
    """Return a human-readable label for the active vector store."""
    return get_settings().vector_store.upper()
