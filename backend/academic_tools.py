"""
LangChain tools for academic database search (Python equivalents of TypeScript tools).
"""
import json
import httpx
import xml.etree.ElementTree as ET
from langchain_core.tools import tool


@tool
async def search_semantic_scholar(query: str, limit: int = 6) -> str:
    """Search millions of academic research papers on Semantic Scholar. Returns papers with titles,
    abstracts, authors, year, citation count, and venue. ALWAYS use this to find existing research
    before generating topics or hypotheses.

    Args:
        query: Academic search query — be specific and include field terms
        limit: Number of papers to return (max 10)
    """
    try:
        limit = min(limit, 10)
        fields = "title,authors,abstract,year,venue,citationCount,externalIds"
        url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={httpx.URL(query)}&fields={fields}&limit={limit}"
        async with httpx.AsyncClient(timeout=10) as client:
            url = f"https://api.semanticscholar.org/graph/v1/paper/search"
            res = await client.get(
                url,
                params={"query": query, "fields": fields, "limit": limit},
                headers={"User-Agent": "AIforResearch/1.0 (research tool)"},
            )
        if res.status_code != 200:
            return f"Search failed with status {res.status_code}"
        data = res.json()
        papers = (data.get("data") or [])[:limit]
        if not papers:
            return "No papers found for this query."
        return json.dumps([
            {
                "title": p.get("title"),
                "authors": ", ".join(a.get("name", "") for a in (p.get("authors") or [])[:3]),
                "abstract": (p.get("abstract") or "")[:400],
                "year": p.get("year"),
                "venue": p.get("venue"),
                "citations": p.get("citationCount"),
                "doi": (p.get("externalIds") or {}).get("DOI"),
            }
            for p in papers
        ])
    except Exception as e:
        return f"Semantic Scholar search error: {e}"


@tool
async def search_arxiv(query: str, max_results: int = 5, category: str = "") -> str:
    """Search arXiv for the latest research preprints across CS, physics, math, biology.
    Best for cutting-edge and recent (2023-2025) papers.

    Args:
        query: arXiv search query
        max_results: Maximum results (max 8)
        category: arXiv category e.g. cs.AI, cs.LG, stat.ML, q-bio.GN
    """
    try:
        max_results = min(max_results, 8)
        cat_filter = f"+AND+cat:{category}" if category else ""
        url = (
            f"https://export.arxiv.org/api/query"
            f"?search_query=all:{httpx.URL(query)}{cat_filter}"
            f"&start=0&max_results={max_results}&sortBy=relevance&sortOrder=descending"
        )
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                "https://export.arxiv.org/api/query",
                params={
                    "search_query": f"all:{query}{cat_filter}",
                    "start": 0,
                    "max_results": max_results,
                    "sortBy": "relevance",
                    "sortOrder": "descending",
                },
                headers={"User-Agent": "AIforResearch/1.0"},
            )
        if res.status_code != 200:
            return f"arXiv search failed with status {res.status_code}"

        root = ET.fromstring(res.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)
        if not entries:
            return "No arXiv papers found."

        results = []
        for entry in entries[:max_results]:
            title = (entry.findtext("atom:title", "", ns) or "").replace("\n", " ").strip()
            summary = (entry.findtext("atom:summary", "", ns) or "").replace("\n", " ").strip()[:400]
            published = entry.findtext("atom:published", "", ns) or ""
            year = published[:4] if published else ""
            arxiv_id_raw = entry.findtext("atom:id", "", ns) or ""
            arxiv_id = arxiv_id_raw.split("/abs/")[-1] if "/abs/" in arxiv_id_raw else arxiv_id_raw
            authors = [a.findtext("atom:name", "", ns) or "" for a in entry.findall("atom:author", ns)][:3]
            results.append({
                "title": title,
                "authors": ", ".join(authors),
                "abstract": summary,
                "year": year,
                "arxivId": arxiv_id,
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
            })
        return json.dumps(results)
    except Exception as e:
        return f"arXiv search error: {e}"


@tool
async def lookup_citation(query: str) -> str:
    """Look up a paper by DOI or title on CrossRef to get complete citation metadata (APA, MLA, Chicago).

    Args:
        query: Paper DOI (e.g. 10.1145/3531146) or paper title
    """
    try:
        is_doi = query.startswith("10.")
        async with httpx.AsyncClient(timeout=8) as client:
            if is_doi:
                res = await client.get(
                    f"https://api.crossref.org/works/{query}",
                    headers={"User-Agent": "AIforResearch/1.0 (mailto:research@aiforresearch.ai)"},
                )
            else:
                res = await client.get(
                    "https://api.crossref.org/works",
                    params={"query.title": query, "rows": 1, "select": "DOI,title,author,published,container-title,volume,issue,page,publisher"},
                    headers={"User-Agent": "AIforResearch/1.0 (mailto:research@aiforresearch.ai)"},
                )
        if res.status_code != 200:
            return "CrossRef lookup failed"
        data = res.json()
        work = data["message"] if is_doi else (data["message"].get("items") or [None])[0]
        if not work:
            return "Paper not found on CrossRef"

        authors_list = work.get("author") or []
        authors = ", ".join(
            f"{a.get('family', '')}, {(a.get('given') or [''])[0]}." if isinstance(a.get('given'), list)
            else f"{a.get('family', '')}, {(a.get('given') or '')[:1]}."
            for a in authors_list
        )
        date_parts = (work.get("published") or {}).get("date-parts") or [[]]
        year = date_parts[0][0] if date_parts and date_parts[0] else "n.d."
        title_raw = work.get("title") or ""
        title = title_raw[0] if isinstance(title_raw, list) else title_raw
        journal_raw = work.get("container-title") or ""
        journal = journal_raw[0] if isinstance(journal_raw, list) else journal_raw
        doi = work.get("DOI") or query
        vol = work.get("volume") or ""
        issue = work.get("issue") or ""
        pages = work.get("page") or ""

        return json.dumps({
            "doi": doi,
            "apa": f"{authors} ({year}). {title}. *{journal}*, *{vol}*({'(' + issue + ')' if issue else ''}), {pages}. https://doi.org/{doi}",
            "mla": f"{authors.split(',')[0] if authors else 'Unknown'}, et al. \"{title}.\" *{journal}*, vol. {vol}, no. {issue}, {year}, pp. {pages}.",
            "chicago": f"{authors} \"{title}.\" *{journal}* {vol}, no. {issue} ({year}): {pages}. https://doi.org/{doi}",
        })
    except Exception as e:
        return f"CrossRef error: {e}"


@tool
async def get_research_trends(topic: str) -> str:
    """Get research publication trends and statistics for a topic from OpenAlex.

    Args:
        topic: Research topic to analyze
    """
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get(
                "https://api.openalex.org/works",
                params={
                    "search": topic,
                    "per-page": 1,
                    "group-by": "publication_year",
                    "mailto": "research@aiforresearch.ai",
                },
                headers={"User-Agent": "AIforResearch/1.0"},
            )
        if res.status_code != 200:
            return "Trend lookup failed"
        data = res.json()
        total = (data.get("meta") or {}).get("count", 0)
        groups = (data.get("group_by") or [])[-5:]
        growing = False
        if len(groups) > 1:
            growing = (groups[-1].get("count") or 0) > (groups[0].get("count") or 0)
        return json.dumps({
            "totalPapers": total,
            "recentYears": [{"year": g.get("key"), "count": g.get("count")} for g in groups],
            "growthTrend": "growing" if growing else "declining" if len(groups) > 1 else "unknown",
        })
    except Exception as e:
        return f"Trend lookup error: {e}"
