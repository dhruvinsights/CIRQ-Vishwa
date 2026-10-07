"""
Corpus ingestion. Every chunk carries provenance so answers can cite it.

A document may have a sidecar `<name>.meta.json`:
  {"title": "...", "doi": "10.xxxx/...", "publisher": "...", "license": "...", "url": "...", "verified": true}
Chunks of documents WITHOUT verified=true are stored with verified=false and the UI shows them as such.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter

from . import store

SUPPORTED = {".md", ".txt", ".pdf"}
_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)


def _read(path: Path) -> str:
    if path.suffix == ".pdf":
        from pypdf import PdfReader

        return "\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages)
    return path.read_text(encoding="utf-8", errors="ignore")


def _meta_for(path: Path) -> dict:
    sidecar = path.with_suffix(path.suffix + ".meta.json")
    meta = json.loads(sidecar.read_text()) if sidecar.exists() else {}
    return {
        "title": meta.get("title", path.stem.replace("_", " ")),
        "doi": meta.get("doi"),
        "publisher": meta.get("publisher"),
        "license": meta.get("license"),
        "url": meta.get("url"),
        "verified": bool(meta.get("verified", False)),
    }


def chunks_for_text(text: str, source: str, meta: dict) -> tuple[list[str], list[dict], list[str]]:
    now = datetime.now(timezone.utc).isoformat()
    parts = _splitter.split_text(text)
    texts, metas, ids = [], [], []
    for i, part in enumerate(parts):
        texts.append(part)
        metas.append({**meta, "source": source, "chunk": i, "ingestedAt": now})
        ids.append(hashlib.sha1(f"{source}:{i}:{part[:64]}".encode()).hexdigest())
    return texts, metas, ids


async def ingest_dir(corpus_dir: str) -> dict:
    root = Path(corpus_dir)
    files = [p for p in sorted(root.rglob("*")) if p.suffix.lower() in SUPPORTED]
    total = 0
    for path in files:
        text = _read(path).strip()
        if not text:
            continue
        texts, metas, ids = chunks_for_text(text, str(path.relative_to(root)), _meta_for(path))
        await store.upsert(texts, metas, ids)
        total += len(texts)
    return {"files": len(files), "chunks": total}


async def ingest_documents(items: list[dict]) -> dict:
    """items: [{'id','text','meta'}] — used for platform data (e.g. farm API records) you decide to index."""
    total = 0
    for it in items:
        texts, metas, ids = chunks_for_text(it["text"], it["id"], it.get("meta", {"verified": False}))
        await store.upsert(texts, metas, ids)
        total += len(texts)
    return {"documents": len(items), "chunks": total}
