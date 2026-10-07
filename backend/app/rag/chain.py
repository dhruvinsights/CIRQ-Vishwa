"""
Retrieval-augmented answering with an honest failure mode:
  * no chunk within RAG_MAX_DISTANCE  -> status INSUFFICIENT_EVIDENCE, the LLM is NOT called
  * otherwise the model may only use numbered context and must cite [n]
Every step is timed for real, so the trace in the UI is measured, not invented.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage, SystemMessage

from ..config import get_settings
from ..llm import get_chat_model
from . import store

SYSTEM = (
    "You are CIRQ's circular agri-food research assistant. Answer ONLY from the numbered context. "
    "Cite every claim with [n]. If the context does not contain the answer, reply exactly: "
    "INSUFFICIENT_EVIDENCE. Never invent numbers, DOIs, or sources. Keep answers concise."
)


@dataclass
class RagResult:
    status: str                       # COMPLETED | INSUFFICIENT_EVIDENCE
    answer: str
    citations: list[dict]
    trace: list[dict] = field(default_factory=list)
    confidence: float = 0.0           # 0-100, derived from retrieval distance — NOT model self-report
    duration_ms: int = 0


def _ms(t0: float) -> int:
    return int((time.perf_counter() - t0) * 1000)


def _confidence(distances: list[float]) -> float:
    if not distances:
        return 0.0
    best = min(distances)
    return round(max(0.0, min(1.0, 1.0 - best)) * 100, 1)  # cosine distance -> similarity


async def answer(question: str, k: int | None = None) -> RagResult:
    s = get_settings()
    k = k or s.rag_top_k
    t_all = time.perf_counter()
    trace: list[dict] = []

    t0 = time.perf_counter()
    hits = await store.search(question, k)
    trace.append({"step": f"Db2 vector search (top {k}, cosine)", "durationMs": _ms(t0), "status": "OK"})

    kept = [(doc, dist) for doc, dist in hits if dist <= s.rag_max_distance]
    citations = [
        {
            "n": i + 1,
            "title": d.metadata.get("title"),
            "source": d.metadata.get("source"),
            "doi": d.metadata.get("doi"),
            "url": d.metadata.get("url"),
            "license": d.metadata.get("license"),
            "verified": bool(d.metadata.get("verified", False)),
            "distance": round(float(dist), 4),
            "excerpt": d.page_content[:280],
        }
        for i, (d, dist) in enumerate(kept)
    ]
    trace.append({"step": f"Relevance filter (distance <= {s.rag_max_distance})",
                  "durationMs": 0, "status": "OK" if kept else "EMPTY"})

    if not kept:
        return RagResult("INSUFFICIENT_EVIDENCE",
                         "No sufficiently relevant evidence in the knowledge base.",
                         [], trace, 0.0, _ms(t_all))

    context = "\n\n".join(f"[{c['n']}] ({c['title']}) {d.page_content}" for c, (d, _) in zip(citations, kept))
    t0 = time.perf_counter()
    msg = await get_chat_model().ainvoke([
        SystemMessage(content=SYSTEM),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {question}"),
    ])
    trace.append({"step": f"Generate answer ({s.llm_provider})", "durationMs": _ms(t0), "status": "OK"})

    text = (msg.content if isinstance(msg.content, str) else str(msg.content)).strip()
    if text.startswith("INSUFFICIENT_EVIDENCE"):
        return RagResult("INSUFFICIENT_EVIDENCE", "The retrieved evidence does not answer this question.",
                         citations, trace, 0.0, _ms(t_all))
    return RagResult("COMPLETED", text, citations, trace,
                     _confidence([dist for _, dist in kept]), _ms(t_all))
