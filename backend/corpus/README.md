# Knowledge corpus

Put **real, citable** documents here (`.md`, `.txt`, `.pdf`), then run `python -m backend.scripts.ingest`.

Add `<file>.meta.json` next to each file:

```json
{"title": "…", "doi": "10.xxxx/…", "publisher": "…", "license": "CC BY 4.0", "url": "https://…", "verified": true}
```

Only set `"verified": true` after you opened the DOI/URL yourself. The UI marks everything else as unverified.
Do NOT paste the old `initialKnowledgeArticles` from `server/db.ts` here: their DOIs/journals do not match
(for example a Global Change Biology citation carrying a J. Cleaner Production DOI).
