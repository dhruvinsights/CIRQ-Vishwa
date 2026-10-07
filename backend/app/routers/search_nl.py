"""Natural-language search: the LLM extracts a structured intent; the resource id is resolved against real data."""
from __future__ import annotations

import json
import re

from fastapi import APIRouter, Depends
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from ..auth import user_dep
from ..legacy import legacy_get
from ..llm import get_chat_model

router = APIRouter(prefix="/search")

PROMPT = (
    "Extract a search intent from the user's query about agricultural residues. Reply with ONLY a JSON object: "
    '{"action":"DISCOVER_PATHWAYS|FIND_PROCESSORS|FIND_RESOURCE|OTHER","resourceName":string|null,'
    '"region":string|null}. Use null when not stated. Never guess.'
)


class NLBody(BaseModel):
    query: str


@router.post("/natural-language")
async def natural_language(body: NLBody, _=Depends(user_dep)):
    msg = await get_chat_model().ainvoke([SystemMessage(content=PROMPT), HumanMessage(content=body.query)])
    raw = msg.content if isinstance(msg.content, str) else str(msg.content)
    m = re.search(r"\{.*\}", raw, re.S)
    try:
        intent = json.loads(m.group(0)) if m else {}
    except json.JSONDecodeError:
        intent = {}
    name = (intent.get("resourceName") or "").lower().strip()
    resource_id = category = None
    if name:
        res = await legacy_get("/resources")
        for r in res.get("resources", []):
            hay = [r.get("name", "")] + list(r.get("aliases", []))
            if any(name in h.lower() or h.lower() in name for h in hay if h):
                resource_id, category = r["id"], r.get("category")
                break
    return {
        "query": body.query,
        "structuredIntent": {"action": intent.get("action", "OTHER"), "resourceId": resource_id,
                             "category": category, "region": intent.get("region"),
                             "filters": {"category": category} if category else {}},
        "resolved": resource_id is not None,
        "status": "LIVE",
    }
