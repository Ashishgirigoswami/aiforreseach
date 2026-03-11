"""
Papers search route — multi-source academic paper search.
"""
import asyncio
import xml.etree.ElementTree as ET
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()


async def search_semantic_scholar(query: str, limit: int = 6) -> list[dict]:
    fields = "title,authors,abstract,year,venue,citationCount,externalIds,openAccessPdf"
    async with httpx.AsyncClient(timeout=8) as client:
        res = await client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": query, "fields": fields, "limit": limit},
            headers={"User-Agent": "AIforResearch/1.0 (academic research tool)"},
        )
    if res.status_code != 200:
        return []
    data = res.json()
    results = []
    for p in data.get("data") or []:
        authors = [a.get("name", "") for a in (p.get("authors") or [])][:5]
        external_ids = p.get("externalIds") or {}
        open_access_pdf = p.get("openAccessPdf") or {}
        results.append({
            "id": f"ss_{p.get('paperId')}",
            "title": p.get("title") or "Untitled",
            "authors": authors,
            "abstract": p.get("abstract") or "Abstract not available.",
            "year": p.get("year"),
            "journal": p.get("venue") or "Unknown Venue",
            "cited": p.get("citationCount") or 0,
            "source": "semantic_scholar",
            "sourceLabel": "Semantic Scholar",
            "url": f"https://www.semanticscholar.org/paper/{p.get('paperId')}",
            "pdfUrl": open_access_pdf.get("url"),
            "doi": external_ids.get("DOI"),
            "externalIds": external_ids,
        })
    return results


async def search_arxiv(query: str, limit: int = 5) -> list[dict]:
    async with httpx.AsyncClient(timeout=8) as client:
        res = await client.get(
            "https://export.arxiv.org/api/query",
            params={"search_query": f"all:{query}", "start": 0, "max_results": limit, "sortBy": "relevance"},
            headers={"User-Agent": "AIforResearch/1.0"},
        )
    if res.status_code != 200:
        return []
    root = ET.fromstring(res.text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entries = root.findall("atom:entry", ns)
    results = []
    for i, entry in enumerate(entries):
        title = (entry.findtext("atom:title", "", ns) or "").replace("\n", " ").strip()
        summary = (entry.findtext("atom:summary", "", ns) or "").replace("\n", " ").strip()
        published = entry.findtext("atom:published", "", ns) or ""
        year = int(published[:4]) if published and len(published) >= 4 and published[:4].isdigit() else None
        arxiv_id_raw = entry.findtext("atom:id", "", ns) or ""
        arxiv_id = arxiv_id_raw.split("/abs/")[-1] if "/abs/" in arxiv_id_raw else f"arxiv_{i}"
        authors = [a.findtext("atom:name", "", ns) or "" for a in entry.findall("atom:author", ns)][:5]
        categories = [c.get("term", "") for c in entry.findall("{http://arxiv.org/schemas/atom}primary_category", {})]
        cat_str = categories[0] if categories else "cs"

        results.append({
            "id": f"arxiv_{arxiv_id}",
            "title": title,
            "authors": authors,
            "abstract": summary,
            "year": year,
            "journal": f"arXiv [{cat_str}]",
            "cited": 0,
            "source": "arxiv",
            "sourceLabel": "arXiv",
            "url": f"https://arxiv.org/abs/{arxiv_id}",
            "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
            "doi": None,
            "externalIds": {"arxiv": arxiv_id},
        })
    return results


async def search_openalex(query: str, limit: int = 5) -> list[dict]:
    async with httpx.AsyncClient(timeout=8) as client:
        res = await client.get(
            "https://api.openalex.org/works",
            params={
                "search": query,
                "per-page": limit,
                "select": "id,title,authorships,abstract_inverted_index,publication_year,primary_location,cited_by_count,doi,open_access",
            },
            headers={"User-Agent": "AIforResearch/1.0 (mailto:research@aiforresearch.ai)"},
        )
    if res.status_code != 200:
        return []
    data = res.json()
    results = []
    for p in data.get("results") or []:
        authorships = p.get("authorships") or []
        authors = [a.get("author", {}).get("display_name", "") for a in authorships][:5]

        abstract = "Abstract not available."
        inverted = p.get("abstract_inverted_index")
        if inverted:
            word_positions = [(word, pos) for word, positions in inverted.items() for pos in positions]
            word_positions.sort(key=lambda x: x[1])
            abstract = " ".join(w for w, _ in word_positions)

        primary_location = p.get("primary_location") or {}
        source = primary_location.get("source") or {}
        open_access = p.get("open_access") or {}
        oa_id = (p.get("id") or "").replace("https://openalex.org/", "")

        results.append({
            "id": f"oa_{oa_id}",
            "title": p.get("title") or "Untitled",
            "authors": authors,
            "abstract": abstract,
            "year": p.get("publication_year"),
            "journal": source.get("display_name") or "Unknown Journal",
            "cited": p.get("cited_by_count") or 0,
            "source": "openalex",
            "sourceLabel": "OpenAlex",
            "url": f"https://openalex.org/{oa_id}",
            "pdfUrl": open_access.get("oa_url"),
            "doi": p.get("doi"),
            "externalIds": {},
        })
    return results


@router.get("/search")
async def papers_search(
    q: str = Query(..., description="Search query"),
    sources: str = Query("semantic_scholar,arxiv,openalex", description="Comma-separated sources"),
):
    if not q.strip():
        return JSONResponse({"error": "Query is required"}, status_code=400)

    active_sources = [s.strip() for s in sources.split(",")]
    tasks = []
    if "semantic_scholar" in active_sources:
        tasks.append(search_semantic_scholar(q, 6))
    if "arxiv" in active_sources:
        tasks.append(search_arxiv(q, 5))
    if "openalex" in active_sources:
        tasks.append(search_openalex(q, 5))

    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    merged = []
    for result in all_results:
        if isinstance(result, list):
            merged.extend(result)

    # Deduplicate by title
    seen: set[str] = set()
    deduped = []
    for p in merged:
        key = "".join(c for c in (p.get("title") or "").lower() if c.isalnum())[:40]
        if key not in seen:
            seen.add(key)
            deduped.append(p)

    deduped.sort(key=lambda x: x.get("cited") or 0, reverse=True)

    return {"results": deduped, "total": len(deduped), "query": q, "sources": active_sources}
