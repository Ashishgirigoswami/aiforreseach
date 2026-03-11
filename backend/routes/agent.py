"""
Agent API routes — SSE-streaming endpoints that replicate the Next.js API routes.
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from agent_factory import sse_generator, run_agent_stream, stream_chain, create_llm
from academic_tools import search_semantic_scholar, search_arxiv, lookup_citation, get_research_trends

router = APIRouter()


# ── /api/agent/topics ────────────────────────────────────────────────────────

class TopicsRequest(BaseModel):
    domain: str


TOPICS_SYSTEM_PROMPT = """You are an expert academic research advisor. Generate novel, impactful research topics.

When given a domain or keywords:
1. FIRST search Semantic Scholar to understand the existing research landscape
2. THEN search arXiv for the latest cutting-edge preprints (2023-2025)
3. THEN check research trends with OpenAlex
4. ANALYZE the literature to identify genuine research gaps
5. GENERATE exactly 5 research topics in this EXACT JSON format wrapped in triple backticks:

```json
{
  "topics": [
    {
      "title": "Specific, actionable research title",
      "noveltyScore": 85,
      "researchGap": "Specific gap explanation referencing actual papers found",
      "keywords": ["kw1", "kw2", "kw3"],
      "relatedPapers": ["Paper Title 1 (year)", "Paper Title 2 (year)"],
      "methodology": "Suggested research approach"
    }
  ]
}
```

Rules:
- Topics must be SPECIFIC, not generic (avoid broad topics like "AI in healthcare")
- noveltyScore should reflect actual gap in literature (70-99 range)
- researchGap MUST reference specific findings from your searches
- Always output valid JSON at the end"""


@router.post("/topics")
async def agent_topics(req: TopicsRequest):
    if not req.domain.strip():
        return {"error": "Domain is required"}, 400

    async def handler(send):
        await send({"type": "status", "status": "Searching academic databases..."})
        result = await run_agent_stream(
            tools=[search_semantic_scholar, search_arxiv, get_research_trends],
            system_prompt=TOPICS_SYSTEM_PROMPT,
            user_input=f'Generate 5 novel research topics for the domain: "{req.domain}". Search the academic literature thoroughly before generating topics.',
            send=send,
            temperature=0.4,
        )
        if result:
            await send({"type": "token", "content": result})

    return StreamingResponse(
        sse_generator(handler),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── /api/agent/hypothesis ────────────────────────────────────────────────────

class HypothesisRequest(BaseModel):
    problem: str


HYPOTHESIS_SYSTEM_PROMPT = """You are a research methodology expert specializing in hypothesis formulation.

When given a research problem:
1. Search Semantic Scholar to understand existing theoretical frameworks
2. Search arXiv for recent empirical evidence
3. Build a complete hypothesis framework in this EXACT JSON format wrapped in triple backticks:

```json
{
  "problemStatement": "Refined, precise problem statement",
  "theoreticalBackground": "2-3 sentences on theoretical basis from literature",
  "variables": {
    "independent": ["Variable 1", "Variable 2"],
    "dependent": ["Outcome 1", "Outcome 2"],
    "moderating": ["Moderator 1"],
    "control": ["Control 1", "Control 2"]
  },
  "hypotheses": [
    {
      "id": "H1",
      "statement": "Formal hypothesis statement",
      "type": "alternative",
      "rationale": "Evidence-based justification"
    },
    {
      "id": "H0",
      "statement": "Null hypothesis statement",
      "type": "null",
      "rationale": "What the null assumes"
    }
  ],
  "suggestedMethods": ["Method 1", "Method 2"],
  "expectedContribution": "What this research contributes to the field"
}
```

Always reference actual papers found in your search."""


@router.post("/hypothesis")
async def agent_hypothesis(req: HypothesisRequest):
    if not req.problem.strip():
        return {"error": "Problem statement required"}, 400

    async def handler(send):
        await send({"type": "status", "status": "Analyzing research problem..."})
        result = await run_agent_stream(
            tools=[search_semantic_scholar, search_arxiv],
            system_prompt=HYPOTHESIS_SYSTEM_PROMPT,
            user_input=f'Build a complete hypothesis framework for this research problem: "{req.problem}". Search for existing literature and theoretical frameworks first.',
            send=send,
            temperature=0.3,
        )
        if result:
            await send({"type": "token", "content": result})

    return StreamingResponse(
        sse_generator(handler),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# ── /api/agent/analyze ───────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    action: str
    text: str


@router.post("/analyze")
async def agent_analyze(req: AnalyzeRequest):
    from langchain_core.prompts import ChatPromptTemplate

    async def handler(send):
        await send({"type": "status", "status": "Analyzing..."})
        llm = create_llm(0.2)

        if req.action == "qualitative":
            prompt = ChatPromptTemplate.from_template(
                """You are a qualitative research analyst with expertise in thematic analysis (Braun & Clarke, 2006).

Analyze the following qualitative data and return ONLY valid JSON wrapped in triple backticks:

```json
{{
  "mainThemes": [
    {{
      "theme": "Theme name",
      "description": "What this theme captures",
      "codes": ["code1", "code2", "code3"],
      "frequency": 12,
      "quotes": ["Representative quote from data"],
      "sentiment": "positive"
    }}
  ],
  "sentiment": {{
    "positive": 45,
    "neutral": 30,
    "negative": 25
  }},
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "researchImplications": "What these themes mean for your research",
  "saturation": "Reached / Not reached"
}}
```

Return 4-6 themes. Frequency = approximate number of references. Sentiments must sum to 100.

Data to analyze:
{text}"""
            )
            await stream_chain(prompt, llm, {"text": req.text}, send)

        elif req.action == "flowchart":
            prompt = ChatPromptTemplate.from_template(
                """You are a research methodology expert. Generate Mermaid.js flowchart code.

Requirements:
- Use flowchart TD direction
- Include decision diamonds {{}} where appropriate
- Use meaningful node labels in [square brackets] or (round brackets)
- Add clear arrows with labels on decision paths
- Return ONLY the raw mermaid code (no markdown fences, no explanation)

Example:
flowchart TD
    A[Research Problem] --> B[Literature Review]
    B --> C{{Gap Found?}}
    C -->|Yes| D[Formulate Hypotheses]
    C -->|No| B
    D --> E[Data Collection]
    E --> F[Analysis]
    F --> G[Results & Discussion]

Research process to diagram:
{text}"""
            )
            await stream_chain(prompt, llm, {"text": req.text}, send)

        elif req.action == "quantitative_interpret":
            prompt = ChatPromptTemplate.from_template(
                """You are a quantitative research analyst. Interpret these statistical results in academic language:

1. Substantive meaning of results
2. Statistical significance interpretation
3. Effect size commentary
4. Limitations to note
5. Recommendations for further analysis

Results: {text}"""
            )
            await stream_chain(prompt, llm, {"text": req.text}, send)

        elif req.action == "illustration_prompt":
            prompt = ChatPromptTemplate.from_template(
                """You are a scientific visualization expert. Describe a detailed scientific diagram for this topic.

Provide:
- Layout and structural description
- Components and their relationships
- Color recommendations (academic blues/greens)
- Labels and annotations
- Flow directions and hierarchy

Description: {text}"""
            )
            await stream_chain(prompt, llm, {"text": req.text}, send)

    return StreamingResponse(
        sse_generator(handler),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# ── /api/agent/write ─────────────────────────────────────────────────────────

class WriteRequest(BaseModel):
    action: str
    text: Optional[str] = None
    tone: Optional[str] = None
    topic: Optional[str] = None


@router.post("/write")
async def agent_write(req: WriteRequest):
    from langchain_core.prompts import ChatPromptTemplate

    async def handler(send):
        await send({"type": "status", "status": "Processing..."})

        if req.action == "outline":
            result = await run_agent_stream(
                tools=[search_semantic_scholar],
                system_prompt="""You are an expert academic writing coach. Generate a complete, detailed research paper outline.

Search for existing literature on the topic first, then create a comprehensive outline in this JSON format wrapped in triple backticks:
```json
{
  "title": "Full paper title",
  "sections": [
    { "title": "Abstract", "content": "3-5 sentence description of section content...", "wordCount": 250 },
    { "title": "1. Introduction", "content": "Detailed section description...", "wordCount": 600 },
    { "title": "2. Literature Review", "content": "Detailed section description...", "wordCount": 1200 },
    { "title": "3. Methodology", "content": "Detailed section description...", "wordCount": 800 },
    { "title": "4. Results", "content": "Detailed section description...", "wordCount": 600 },
    { "title": "5. Discussion", "content": "Detailed section description...", "wordCount": 700 },
    { "title": "6. Conclusion", "content": "Detailed section description...", "wordCount": 300 }
  ],
  "estimatedTotal": 4450
}
```
Make each section content detailed and substantive (3-5 sentences each).""",
                user_input=f'Generate a complete research paper outline for: "{req.topic or req.text}"',
                send=send,
                temperature=0.4,
            )
            if result:
                await send({"type": "token", "content": result})

        elif req.action == "citation":
            result = await run_agent_stream(
                tools=[lookup_citation, search_semantic_scholar],
                system_prompt="""You are a citation expert. Look up the paper using the CrossRef tool first, then format citations.

Return ONLY this JSON wrapped in triple backticks:
```json
{
  "apa": "Author, A. (Year). Title. Journal, Volume(Issue), pages. https://doi.org/...",
  "mla": "Author. \\"Title.\\" Journal, vol. X, no. Y, Year, pp. Z.",
  "chicago": "Author. \\"Title.\\" Journal X, no. Y (Year): Z. https://doi.org/..."
}
```

If CrossRef doesn't find it, search Semantic Scholar.""",
                user_input=f'Generate citations for: "{req.text}"',
                send=send,
                temperature=0.1,
            )
            if result:
                await send({"type": "token", "content": result})

        else:
            llm = create_llm(0.4)
            prompts = {
                "improve": """You are an expert academic editor. Improve the following text for academic clarity, precision, and formal tone.

Rules:
- Maintain all original facts and citations
- Use precise academic vocabulary
- Convert informal phrases to formal equivalents
- Fix grammar, sentence structure, and flow
- Output ONLY the improved text, nothing else

Text to improve:
{text}""",
                "paraphrase": """You are an academic writing assistant. Paraphrase the following text in {tone} academic tone.

Tone guidelines:
- formal: Precise, passive voice appropriate, sophisticated vocabulary
- technical: Domain-specific terminology, methodological language
- simplified: Clear, direct, accessible without jargon

Maintain ALL citations and key information. Output ONLY the paraphrased text.

Text:
{text}""",
                "autocomplete": """You are an academic writing assistant embedded in a research paper editor. Continue the following academic text naturally.

Requirements:
- Match the exact writing style and tone
- Write 3-5 sentences that flow seamlessly from the provided text
- Maintain academic register and citation style
- Do NOT repeat what's already written
- Output ONLY the continuation, nothing else

Text so far:
{text}""",
                "grammar": """You are a professional academic editor. Fix grammar, improve clarity, and enhance academic tone. Output ONLY the corrected text with no preamble.

{text}""",
            }

            template = prompts.get(req.action, prompts["grammar"])
            prompt = ChatPromptTemplate.from_template(template)
            variables = {"text": req.text or "", "tone": req.tone or "formal"}
            await stream_chain(prompt, llm, variables, send)

    return StreamingResponse(
        sse_generator(handler),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# ── /api/agent/publish ───────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    action: str
    text: Optional[str] = None
    title: Optional[str] = None
    journal: Optional[str] = None
    domain: Optional[str] = None


@router.post("/publish")
async def agent_publish(req: PublishRequest):
    from langchain_core.prompts import ChatPromptTemplate

    async def handler(send):
        await send({"type": "status", "status": "Processing manuscript..."})
        llm = create_llm(0.2)

        if req.action == "review":
            result = await run_agent_stream(
                tools=[search_semantic_scholar],
                system_prompt="""You are a senior academic peer reviewer. Review the manuscript thoroughly. Search Semantic Scholar to compare with existing literature.

Return a complete review in this JSON format wrapped in triple backticks:
```json
{
  "verdict": "Accept / Minor Revision / Major Revision / Reject",
  "scores": {
    "clarity": 85,
    "novelty": 78,
    "methodology": 91,
    "citations": 82,
    "journalReadiness": 76,
    "overall": 82
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "majorComments": ["Comment 1 for authors", "Comment 2"],
  "minorComments": ["Minor fix 1", "Minor fix 2"],
  "suggestedJournals": ["Journal 1", "Journal 2"]
}
```""",
                user_input=f'Review this manuscript: "{(req.text or "")[:2000]}"',
                send=send,
                temperature=0.2,
            )
            if result:
                await send({"type": "token", "content": result})

        elif req.action == "plagiarism":
            prompt = ChatPromptTemplate.from_template("""You are a plagiarism detection specialist. Analyze for potential similarity issues.

Return ONLY JSON wrapped in triple backticks:
```json
{{
  "overallRisk": 12,
  "riskLevel": "Low",
  "sections": [
    {{"section": "Introduction", "risk": 15, "issue": "Generic opening phrases", "suggestion": "Personalize the opening"}}
  ],
  "flaggedPhrases": [
    {{"phrase": "text snippet", "reason": "why flagged", "fix": "how to fix"}}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}}
```

Text: {text}""")
            await stream_chain(prompt, llm, {"text": req.text or ""}, send)

        elif req.action == "ai_detection":
            prompt = ChatPromptTemplate.from_template("""You are an AI writing detection specialist. Analyze writing patterns.

Return ONLY JSON wrapped in triple backticks:
```json
{{
  "overallRisk": 18,
  "verdict": "Predominantly Human-Written",
  "confidence": "High",
  "sections": [
    {{"section": "Abstract", "risk": 22, "signals": ["uniform sentence length"]}}
  ],
  "humanSignals": ["Personal research voice detected"],
  "aiSignals": ["Some transition phrases overused"],
  "recommendations": ["Vary sentence structure", "Add more personal observations"]
}}
```

Text: {text}""")
            await stream_chain(prompt, llm, {"text": req.text or ""}, send)

        elif req.action == "cover_letter":
            prompt = ChatPromptTemplate.from_template("""You are an expert in academic journal submissions. Write a professional cover letter for journal submission.

Paper Title: {title}
Target Journal: {journal}

Write a complete, formal cover letter that:
1. Addresses the Editor-in-Chief formally with Dear Editor
2. States the manuscript title and submission type
3. Summarizes the key contribution in 2-3 sentences
4. Explains significance to the journal's readership
5. States no conflicts of interest and not under review elsewhere
6. Closes professionally with [Author Name], [Institution], [Email], [ORCID] placeholders

Use formal academic English. Make it specific to the named journal.""")
            await stream_chain(
                prompt, llm,
                {"title": req.title or "Untitled", "journal": req.journal or "the journal"},
                send,
            )

        elif req.action == "journal_match":
            result = await run_agent_stream(
                tools=[search_semantic_scholar],
                system_prompt="""You are a research publishing expert who helps match papers to the right journals.

Search for papers in the domain to understand which venues publish this type of work.

Return journal recommendations in JSON wrapped in triple backticks:
```json
{
  "journals": [
    {
      "name": "Full journal name",
      "publisher": "Publisher name",
      "impactFactor": 8.5,
      "quartile": "Q1",
      "acceptanceRate": "15%",
      "avgReviewTime": "3 months",
      "openAccess": false,
      "whyRecommended": "Specific reason this journal matches the research"
    }
  ]
}
```

Recommend 5 journals ranging from high-impact to more accessible options.""",
                user_input=f'Match journals for a paper in this domain: "{req.domain or req.text}"',
                send=send,
                temperature=0.2,
            )
            if result:
                await send({"type": "token", "content": result})

    return StreamingResponse(
        sse_generator(handler),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
