from fastapi import APIRouter, Depends, HTTPException, Body, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import get_current_user
from app.core.ai_client import AIClient
from app.models.user import User
from app.services.docx_service import build_docx
from typing import List, Dict, Optional
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

SYSTEM_PROMPTS = {
    "research": """You are VEDA, an AI research paper writing assistant. Help users write, improve, and complete academic research papers.

Capabilities: writing sections, finding real papers (arXiv with PDF links), outlining, citations (APA/MLA/IEEE), critique, humanizing.

Write in a natural, human-like academic voice. Vary sentence structure. Sound like an experienced researcher.""",

    "mun": """You are VEDA-MUN, a Model United Nations expert. Help delegates prepare for MUN conferences.

Capabilities:
1. **Position Papers**: Write persuasive country position papers on UN agenda topics
2. **Resolutions**: Draft UN-style resolutions with preambulatory and operative clauses
3. **Opening Speeches**: Write powerful 1-minute opening speeches for any country
4. **Policy Research**: Summarize a country's stance, allies, and voting history on issues
5. **Crisis Notes**: Draft short crisis communiques for crisis committees
6. **Amendments**: Suggest amendments to draft resolutions
7. **Clauses**: Write preambulatory and operative clauses in proper UN format
8. **Strategy**: Recommend blocs, negotiation tactics, and lobbying approaches

Format resolutions properly with "The General Assembly/Economic and Social Council/Security Council," "Reaffirming...", "Noting with concern...", and numbered operative clauses ending with semicolons (last clause ends with period).

ALWAYS include the country's perspective. Use formal diplomatic language. Reference UN charter articles, past resolutions, and international law where relevant.""",

    "literature": """You are VEDA-Lit, a literature review specialist. Help researchers conduct and write literature reviews.

Capabilities:
1. **Search Strategy**: Suggest databases, keywords, and search strings for systematic reviews
2. **Paper Summaries**: Summarize individual papers (purpose, methods, findings, limitations)
3. **Synthesis**: Identify themes, debates, gaps, and trends across multiple papers
4. **Critique**: Evaluate methodology quality, sample sizes, and analytical rigor
5. **Gap Analysis**: Identify underexplored areas and future research directions
6. **Citations**: Generate citations in APA, MLA, IEEE, Chicago, BibTeX formats
7. **PRISMA**: Help design PRISMA flow diagrams for systematic reviews
8. **Framework**: Suggest theoretical frameworks for organizing the review

When suggesting papers, ALWAYS provide the full title, authors, year, journal, DOI, and direct PDF/abstract link.

Write in analytical, objective academic style. Compare and contrast findings across studies.""",

    "brainstorm": """You are VEDA-Ideas, a creative brainstorming partner. Help researchers generate and refine ideas.

Capabilities:
1. **Idea Generation**: Suggest novel research questions, hypotheses, and approaches
2. **Concept Mapping**: Connect disparate ideas across disciplines
3. **Problem Framing**: Reframe research problems from different angles
4. **Methodology Design**: Propose experimental designs, data sources, and analytical methods
5. **Interdisciplinary Links**: Connect your topic to other fields for fresh perspectives
6. **Provocative Questions**: Ask thought-provoking questions that challenge assumptions
7. **Analogy Generation**: Use analogies to explain complex concepts
8. **Grant Ideas**: Suggest funding-worthy research directions

Be creative, bold, and thought-provoking. Challenge the user's assumptions. Suggest unconventional approaches. Use "What if..." and "Have you considered..." thinking.""",

    "editor": """You are VEDA-Edit, an academic writing editor. Polish and improve scholarly writing.

Capabilities:
1. **Clarity**: Simplify complex sentences, improve readability, fix awkward phrasing
2. **Structure**: Improve paragraph flow, topic sentences, transitions between sections
3. **Conciseness**: Cut wordiness, redundancy, and unnecessary jargon
4. **Grammar**: Fix grammatical errors, subject-verb agreement, punctuation, parallelism
5. **Style**: Enforce academic style (active vs passive voice, formality level, consistency)
6. **Argumentation**: Strengthen claims, improve evidence presentation, fix logical gaps
7. **Formatting**: Check section numbering, heading hierarchy, citation consistency
8. **Tone**: Adjust tone for target journal (formal, clinical, persuasive, technical)

Preserve the author's meaning and voice. Show the original text, then the revised version, and briefly explain key changes.

Be precise, thorough, and constructive.""",

    "review": """You are VEDA-Review, a peer review simulator. Provide constructive feedback on academic work as if you were a peer reviewer for a top journal.

Capabilities:
1. **Methodology Critique**: Evaluate study design, sample size, controls, statistical methods
2. **Argument Analysis**: Identify logical gaps, unsupported claims, weak evidence
3. **Literature Context**: Assess whether relevant literature was cited and positioned correctly
4. **Contribution Assessment**: Evaluate the novelty and significance of contributions
5. **Structural Feedback**: Comment on organization, clarity, flow, and readability
6. **Major Issues**: Flag fundamental problems that must be addressed
7. **Minor Issues**: Note formatting, citation, grammar, and presentation concerns
8. **Overall Recommendation**: Summarize with accept/major revision/minor revision/reject

Format feedback professionally. Start with a summary paragraph, then bullet-point major issues, then minor issues. Conclude with an overall recommendation and constructive suggestions.

Be rigorous but respectful. Model feedback after real peer reviews from top journals in the field.""",
}

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    mode: str = "research"

class HumanizeRequest(BaseModel):
    text: str

class PaperSearchRequest(BaseModel):
    query: str
    max_results: int = 5

import xml.etree.ElementTree as ET

async def fetch_arxiv_papers(query: str, max_results: int = 5) -> str:
    q = query.replace(" ", "+")
    url = f"http://export.arxiv.org/api/query?search_query=all:{q}&max_results={max_results}&sortBy=relevance&sortOrder=descending"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            resp = await c.get(url)
            if resp.status_code != 200:
                return ""
            root = ET.fromstring(resp.text)
            ns = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
            lines = []
            for entry in root.findall("a:entry", ns):
                title = entry.find("a:title", ns)
                authors = [a.find("a:name", ns).text for a in entry.findall("a:author", ns) if a.find("a:name", ns) is not None]
                link_el = entry.find("a:id", ns)
                arxiv_id = link_el.text.split("/")[-1] if link_el is not None else ""
                summary = entry.find("a:summary", ns)
                t = (title.text or "").replace("\n", " ").strip()[:100] if title is not None else ""
                a_str = ", ".join(authors[:3])
                lines.append(f"- \"{t}\" by {a_str} — arXiv:{arxiv_id} — PDF: https://arxiv.org/pdf/{arxiv_id}.pdf")
            return "\n".join(lines)
    except:
        return ""

# Always inject arXiv papers — every user message gets real paper suggestions
def needs_papers(text: str) -> bool:
    t = text.lower()
    # Skip trivial messages
    if len(t.split()) < 3:
        return False
    skip_words = ["hello", "hi ", "hey", "thanks", "thank you", "ok", "okay", "yes", "no", "good", "great", "nice", "who are you", "what can you"]
    for s in skip_words:
        if t.strip() == s or t.startswith(s + " ") or t.startswith(s + ",") or t.startswith(s + "!"):
            return False
    return True

@router.post("/chat/stream")
async def chat_stream(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    last_user_msg = ""
    for m in reversed(body.messages):
        if m["role"] == "user":
            last_user_msg = m["content"]
            break

    paper_context = ""
    if last_user_msg and needs_papers(last_user_msg):
        papers = await fetch_arxiv_papers(last_user_msg)
        if papers:
            paper_context = f"\n\nHere are real papers from arXiv relevant to the user's query. REFERENCE THESE in your response with their PDF links:\n{papers}"

    system_prompt = SYSTEM_PROMPTS.get(body.mode, SYSTEM_PROMPTS["research"])
    full_messages = [{"role": "system", "content": system_prompt + paper_context}] + body.messages
    client = AIClient()
    async def generate():
        async for chunk in client.chat_stream(full_messages):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/export/docx")
async def export_docx(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    docx_bytes = build_docx(body.messages)
    from fastapi.responses import Response
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=veda-paper.docx"}
    )

@router.post("/search-papers")
async def search_papers(body: PaperSearchRequest):
    query = body.query.replace(" ", "+")
    url = f"http://export.arxiv.org/api/query?search_query=all:{query}&max_results={body.max_results}&sortBy=relevance&sortOrder=descending"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="arXiv search failed")
        import xml.etree.ElementTree as ET
        root = ET.fromstring(resp.text)
        ns = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
        papers = []
        for entry in root.findall("a:entry", ns):
            title = entry.find("a:title", ns)
            summary = entry.find("a:summary", ns)
            published = entry.find("a:published", ns)
            authors = [a.find("a:name", ns).text for a in entry.findall("a:author", ns) if a.find("a:name", ns) is not None]
            link_el = entry.find("a:id", ns)
            arxiv_id = link_el.text.split("/")[-1] if link_el is not None else ""
            papers.append({
                "title": (title.text or "").replace("\n", " ").strip() if title is not None else "",
                "authors": authors,
                "summary": (summary.text or "").replace("\n", " ").strip()[:300] if summary is not None else "",
                "year": published.text[:4] if published is not None else "",
                "arxiv_id": arxiv_id,
                "pdf_url": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                "arxiv_url": f"https://arxiv.org/abs/{arxiv_id}",
            })
        return {"papers": papers}

@router.post("/humanize")
async def humanize(body: HumanizeRequest, current_user: User = Depends(get_current_user)):
    client = AIClient()
    prompt = f"""Rewrite the following text to sound more natural and human-like, as if written by an experienced researcher rather than an AI. Vary sentence structure, use natural transitions, and avoid robotic or repetitive phrasing. Keep the same information and academic tone, but make it flow naturally.

Text to humanize:
{body.text}"""
    result = await client.chat([{"role": "system", "content": "You are an expert at making AI-generated academic text sound natural and human-like."}, {"role": "user", "content": prompt}])
    return {"result": result}

class GeneratePaperRequest(BaseModel):
    topic: str

@router.post("/generate-paper")
async def generate_paper(body: GeneratePaperRequest, current_user: User = Depends(get_current_user)):
    papers = await fetch_arxiv_papers(body.topic, 8)
    refs = ""
    if papers:
        refs = f"\n\nUse these real papers as references. Cite them in the text and include them in the reference list:\n{papers}"

    client = AIClient()
    prompt = f"""Write a complete academic research paper on the topic: "{body.topic}"

Format the paper with these sections:
# Abstract
(150-200 words summarizing the paper)

# Introduction
(Background, problem statement, research questions, paper structure)

# Related Work
(Discuss existing research and position this work)

# Methodology
(Approach, methods, techniques used)

# Results and Discussion
(Key findings, analysis, implications)

# Conclusion
(Summary, contributions, limitations, future work)

# References
(List all cited works with full details)

Write in formal academic English. Each section should be substantial (3-8 paragraphs). Include specific details, arguments, and analysis. Use citations like [Author, Year] in the text.{refs}"""

    result = await client.chat([{"role": "system", "content": "You are a PhD-level academic researcher writing a rigorous research paper. Write with authority, precision, and depth."}, {"role": "user", "content": prompt}])

    messages = [
        {"role": "user", "content": f"Write a research paper about: {body.topic}"},
        {"role": "assistant", "content": result},
    ]
    docx_bytes = build_docx(messages)
    from fastapi.responses import Response
    safe = body.topic.replace(" ", "_")[:50]
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={safe}.docx"}
    )
