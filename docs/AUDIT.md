# CIRQ audit — what each feature is for, and what is real

Method: read README (the only development plan in the zip), `server/api.ts` (all ~150 routes), `server/db.ts`,
the frontend API clients and schemas, and spot-checked screens. **I did not run the app** (no network in my sandbox),
so "works" below means "code path is real", not "I clicked it". Screens not named in a finding were not audited line by line.

## 1. Feature map

| Route | Purpose | Backend today | Verdict |
|---|---|---|---|
| `/` Overview | Command centre | Express domain engine + hardcoded events | KEEP, remove fake events (§3) |
| `/map` | Spatial resource map | Engine + `public/data/*.geojson` | KEEP; consolidate 3 renderers → MapLibre |
| `/resources`, `/resources/:id` | Feedstock registry + 16 inspection tabs | Engine, 5 seed rows | KEEP; real data must come from farm API / imports |
| `/graph` | Feedstock→Process→Product graph | Engine | KEEP |
| `/pathways`, `/simulator` | Rank + simulate conversion pathways | Engine (formula-based) | KEEP; document formulas + sources |
| `/processors`, `/matching`, `/logistics` | Facility registry, matching, GLEC routes | Engine | KEEP |
| `/impact`, `/scenarios`, `/loops` | Carbon/economic accounting, what-if, loops | Engine | KEEP; every factor needs a cited source |
| `/ai` | AI services + traces | **Was fake** (always COMPLETED, confidence 95) → **now real** (Python) | KEEP (rewritten) |
| `/data` | Source lineage | **Was fabricated** (record counts, "LIVE") → now measured reachability | KEEP (rewritten) |
| `/integrations` | Connectors | **Was fabricated** (`tested:true`, `newRecords:48`) → now real test/sync | KEEP (rewritten) |
| `/research` | Evidence | **Seed DOIs are inconsistent** → now Db2 RAG over your corpus | KEEP (rewritten) |
| `/demo` | 9-step walkthrough | Hardcoded ids; step 9 read a seeded fake execution | KEEP; fixed step 9; summary strings still hardcoded |
| `/system` | Health | Mixed | KEEP; wired to `/health/ready` |
| `/settings`, `/settings/layers` | Prefs, GeoJSON layers | Token box stored a JWT in `sessionStorage` | KEEP; token box removed |
| `/__ui` | Component gallery | none | REMOVE from production build |

## 2. Fixed in this delivery
- Python backend (FastAPI) is now the single entry point; it **replaces** the fake AI/NL-search/integration/data-source/knowledge routes and proxies everything else to the Express engine.
- Auth: browser no longer holds a token (`sessionStorage` JWT box removed). Cookie session + CSRF header per the Application SDK.
- RAG: Db2 `DB2VS` vector store, ingestion, cited answers, refuses to answer without evidence.
- `ConfidenceMeter` defaulted to "4 evidence / Validated" when callers omitted props → now `0 / Unknown`.
- `ConfidenceMeter` misuse (`value` vs `score`) avoided in new code.
- Demo step 9 no longer depends on a seeded execution id.
- Removed: `server.ts` (Vite-inside-Express), `bun.lock` (README says npm), `@google/genai` (unused on the client; LLM calls now Python-side).

## 3. Still fake / to remove next (see TODO.md)
- 67 hardcoded `status: 'LIVE'` literals in `server/api.ts`; `DEMO` rows labelled live.
- `/system/events` — four hardcoded events with fixed timestamps; `/system/events/stream` sends `Math.random()` queue depth/throughput, shown in the UI as "Sub-second streaming events from CIRQ engine and OGC sensors".
- `/search/regions` — hardcoded `activeBiomassTons` per region.
- `initialKnowledgeArticles` in `db.ts` — e.g. a *Global Change Biology* citation carrying a *J. Cleaner Production* DOI. Never index these as truth.
- Seed hosts such as `api.agrifooddata.eu` are not documented anywhere; the real farm API host is per deployment.
- `metadata.json` (AI Studio-specific), `/__ui` gallery, duplicate map components (`RealAgriculturalMap`, `OperationalMap`).
- Role selector in Settings is client-side only; real roles come from `/api/v1/me`.
- All domain data (5 resources, 5 processors, 5 pathways, 3 loops) is demo data held in process memory → lost on restart, wrong with >1 replica.

## 4. Architecture decision (why Python)
The Application SDK (`appext`) is a Python 3.12 library (FastAPI) and `langchain-db2` is Python. Re-implementing OIDC + PKCE +
token exchange in Node by hand is a security risk, so the backend is Python. The Express engine stays **temporarily**
behind the Python proxy (strangler-fig) so the frontend keeps working while routes are ported group by group.
Deviation to know about: the SDK assumes *one process per container*; this image runs two until the port is finished.
