"""
Db2 vector store via langchain-db2 (DB2VS). Requires Db2 >= 12.1.2 (native VECTOR type).

ibm_db connections are not thread-safe, so every call goes through one lock and runs in a worker
thread. That is correct for one replica; for more throughput replace with a connection pool
(see docs/TODO.md, P2).
"""
from __future__ import annotations

import asyncio
import threading
from functools import lru_cache

from ..config import get_settings
from ..errors import NotConfigured
from ..llm import get_embeddings

_lock = threading.Lock()


def _distance_cosine():
    try:  # langchain-db2 re-exports it from its module
        from langchain_db2.db2vs import DistanceStrategy
    except ImportError:  # older layouts
        from langchain_community.vectorstores.utils import DistanceStrategy
    return DistanceStrategy.COSINE


@lru_cache
def _store():
    s = get_settings()
    if not s.db2_configured:
        raise NotConfigured(
            "The Db2 vector store",
            "Set DB2_DATABASE, DB2_HOST, DB2_PORT, DB2_USERNAME, DB2_PASSWORD (Db2 12.1.2+).",
        )
    from langchain_db2 import DB2VS

    return DB2VS(
        embedding_function=get_embeddings(),
        table_name=s.db2_rag_table,
        distance_strategy=_distance_cosine(),
        connection_args={
            "database": s.db2_database,
            "host": s.db2_host,
            "port": s.db2_port,
            "username": s.db2_username,
            "password": s.db2_password,
            "security": s.db2_security,
        },
    )


def _sync_search(query: str, k: int):
    with _lock:
        return _store().similarity_search_with_score(query, k=k)


def _sync_upsert(texts: list[str], metadatas: list[dict], ids: list[str]):
    with _lock:
        store = _store()
        try:
            store.delete(ids=ids)  # idempotent re-ingest: ids are deterministic
        except Exception:  # noqa: BLE001  (first run: nothing to delete)
            pass
        store.add_texts(texts=texts, metadatas=metadatas, ids=ids)


def _sync_count() -> int | None:
    with _lock:
        try:
            cur = _store().client.cursor()
            cur.execute(f'SELECT COUNT(*) FROM "{get_settings().db2_rag_table.upper()}"')
            return int(cur.fetchone()[0])
        except Exception:  # noqa: BLE001
            return None


async def search(query: str, k: int):
    """Return [(Document, distance)] — lower distance is closer (cosine)."""
    return await asyncio.to_thread(_sync_search, query, k)


async def upsert(texts: list[str], metadatas: list[dict], ids: list[str]) -> None:
    await asyncio.to_thread(_sync_upsert, texts, metadatas, ids)


async def count() -> int | None:
    return await asyncio.to_thread(_sync_count)
