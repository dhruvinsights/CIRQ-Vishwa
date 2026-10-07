"""Index backend/corpus into Db2. Usage (from repo root):  python -m backend.scripts.ingest"""
import asyncio

from backend.app.config import get_settings
from backend.app.rag import ingest


async def main() -> None:
    s = get_settings()
    result = await ingest.ingest_dir(s.corpus_dir)
    print(f"Indexed {result['chunks']} chunks from {result['files']} files into {s.db2_rag_table}")


if __name__ == "__main__":
    asyncio.run(main())
