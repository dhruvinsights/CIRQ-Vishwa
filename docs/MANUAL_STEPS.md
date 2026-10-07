# What only you can do

I had no credentials in my environment (no `.env`, no relevant variables), so nothing below was done for you.

## 1. Install
```bash
npm install
python3.12 -m venv .venv && . .venv/bin/activate
pip install -e "backend/[test]"          # add ,appext,watsonx as needed
# SDK is 0.1.0 "not yet released": if PyPI has no `appext`, use the extra, which installs from GitHub
pip install -e "backend/[appext]"
```
`ibm_db` (pulled in by langchain-db2) ships wheels for common platforms; if it fails to build, install IBM's driver first.

## 2. Create `.env` from `.env.example` and fill
| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio (or switch to `LLM_PROVIDER=watsonx` + `WATSONX_*`) |
| `DB2_DATABASE/HOST/PORT/USERNAME/PASSWORD` | Your Db2 instance. **Must be 12.1.2 or newer** (native vector type) |
| `FARM_API_BASE_URL` | Platform operator: `https://<host>/v1` |
| `FARM_API_TOKEN` | Dev only; in `appext` mode it is never used |
Check model names (`EMBEDDING_MODEL`, `CHAT_MODEL`) are still current for your provider.

## 3. Knowledge corpus (RAG)
Put real papers/reports in `backend/corpus/` with `.meta.json` files (see its README), then `npm run ingest`.
Open each DOI yourself before setting `"verified": true`. The embedding model fixes the vector size of the Db2 table;
**changing `EMBEDDING_MODEL` later means dropping `CIRQ_KNOWLEDGE` and re-ingesting.**

## 4. Application SDK / platform
1. Ask the platform operator for: issuer URL, app-registry (store) URL, and the **service catalog** entry for the farm API.
2. `cp appext.toml.example appext.toml` and fill it.
3. In `extension.toml` replace the placeholder `audience`, `scopes` and `[consent].scopes` with real catalog values (`appext store services`), then run `appext manifest check`.
4. Register/submit: `appext store login && appext store register && appext store submit`; a reviewer must approve before the client exists.
5. Run with `AUTH_MODE=appext`. Until your client is provisioned use `AUTH_MODE=dev`.

## 5. Things I could not verify (please check on first run)
- `ext.router()` accepting `include_router`, and `ext.asgi()` returning a FastAPI-compatible app
- Exact CSRF header *value* (docs name the header `X-Appext-CSRF` but not the value)
- `langchain_db2` import path for `DistanceStrategy` (code tries two locations)
- AGROVOC REST route `https://agrovoc.fao.org/browse/rest/v1/search`
- Farm API list route `/farms` (taken from the SDK docs' example; confirm against your deployment's OpenAPI)

## 6. Content-Security-Policy and the map
The SDK sets `default-src 'self'`. `hosts` in the manifest widens only `img-src`/`font-src`. MapLibre fetches tiles with
`fetch`, which `connect-src` governs, so a remote basemap (Carto) will likely be **blocked**. Options: self-host tiles
(PMTiles/TileServer GL on your origin), or add a tile proxy route to the backend. This is your call (terms of use, cost).

## 7. Decisions only you can make
- Keep the two-process image for now, or pause features and port the engine first
- Which platform/deployment you target (the SDK has no built-in one)
- Whether demo seed data stays in production builds (recommendation: no)
