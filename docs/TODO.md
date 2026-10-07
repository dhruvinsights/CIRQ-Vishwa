# CIRQ to-do list (ordered). `[x]` = done in this delivery.

## P0 — make it run and make it honest
- [x] Python backend skeleton, config via env, error envelope matching the frontend client
- [x] Application SDK wiring (`AUTH_MODE=appext`), dev fallback (`AUTH_MODE=dev`)
- [x] Real AI services (knowledge assistant, AGROVOC resolver); executions measured, not canned
- [x] Db2 RAG: store, ingest, chain, `/ai/ask`, `/knowledge/*`
- [x] Real integration test/sync, measured data-source status
- [x] Remove JWT-in-browser; 401 → SDK login redirect
- [ ] **You:** complete `docs/MANUAL_STEPS.md` (credentials, corpus, platform values)
- [ ] `npm install && pip install -e "backend/[appext]"`, run `npm run lint` and `pytest backend/tests`, fix what surfaces (I could not execute either)
- [ ] Verify `ext.router(...).include_router(...)` and `ext.asgi()` behave as assumed in `backend/app/main.py`
- [ ] Verify CSRF header value for `X-Appext-CSRF` (`src/api/client.ts`) against the SDK

## P1 — kill remaining fakes
- [ ] Delete the 67 `status: 'LIVE'` literals; derive status from real provenance
- [ ] Replace `/system/events` + SSE with real events (log of actual API calls / job completions), or hide the card
- [ ] Remove `/search/regions` hardcoded list; derive from layers + farm API regions
- [ ] Delete `initialKnowledgeArticles`, fabricated AI/integration/data-source seeds and their Express routes
- [ ] Demo screen: drive summary text from step results instead of hardcoded strings
- [ ] Persist AI executions + integration registry in Db2 (currently in-memory → single replica)
- [ ] Real roles: use `/api/v1/me`; delete the client-side role selector

## P1 — data from the farm API directly (no custom backend needed)
- [ ] Get the deployment host, audience and scopes (`appext store services`) and fill `extension.toml`
- [ ] Resources/fields/regions → read from farm API collections via `/api/v1/farm/{collection}`; map entities in a Python adapter
- [ ] Regions as OGC API Features → feed the map instead of static GeoJSON
- [ ] Sensor streams → SensorThings (`STA_BASE_URL`), only if your platform offers it

## P2 — port the engine to Python (one group per PR; delete the Express route when its test passes)
1. `resources`, `search/*`  2. `processors`, `matching`  3. `pathways`, `simulations`  4. `logistics`
5. `impact`, `scenarios`, `loops`  6. `map/*`, `network/*`  → then delete `server/`, `Dockerfile` second process
- [ ] Put seed + user data in Db2 tables (not module-level arrays)
- [ ] Every coefficient (conversion efficiency, EX-ACT/GLEC factors) gets a `source` + `retrievedAt` field

## P2 — frontend cleanup
- [ ] One map renderer (MapLibre); delete `RealAgriculturalMap.tsx`, `OperationalMap.tsx`
- [ ] Remove `/__ui` route from production; delete `metadata.json`
- [ ] Research screen: show verified/unverified badge; default query instead of empty state
- [ ] CSP-safe basemap (see MANUAL_STEPS §6)
- [ ] Replace per-screen `setTimeout` notices with a toast store

## P3 — scale and operate
- [ ] Db2 connection pool (current: one lock-guarded connection, fine for one replica)
- [ ] Redis session store for the SDK when running >1 replica (docs/deployment in the SDK repo)
- [ ] Rate-limit `/ai/*`; token/cost logging for LLM calls
- [ ] CI: `appext manifest check --scan-secrets`, `pytest`, `tsc --noEmit`, `vite build`
- [ ] RAG evaluation set (20+ Q/A with expected sources) and a threshold-tuning script for `RAG_MAX_DISTANCE`
