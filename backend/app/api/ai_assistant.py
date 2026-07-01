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

SYSTEM_PROMPT = """You are VEDA, an AI research paper writing assistant. Your purpose is to help users write, improve, and complete academic research papers.

Your capabilities:
1. **Writing**: Draft sections (abstract, introduction, methodology, results, discussion, conclusion), improve existing text, suggest phrasing
2. **Research**: Suggest real, verifiable papers using arXiv IDs and DOIs. When the user asks about a topic, search for actual published papers.
3. **Structure**: Help outline papers, suggest logical flow, ensure academic structure
4. **Citations**: Format citations in APA, MLA, IEEE, or BibTeX
5. **Review**: Critique drafts, suggest improvements, check for clarity and rigor
6. **Humanize**: Write in natural, flowing academic English that reads like a human wrote it. Avoid robotic phrasing, repetitive sentence structures, and obvious AI patterns.

When suggesting research papers, you MUST include the direct PDF link as a clickable URL like: https://arxiv.org/pdf/XXXX.XXXXX.pdf — always put the full `https://` link. Include: full title, authors, year, and direct PDF link. NEVER mention a paper without giving the PDF link.

Write in a natural, human-like academic voice. Vary sentence structure. Use transitions. Sound like an experienced researcher, not a language model."""

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

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

    full_messages = [{"role": "system", "content": SYSTEM_PROMPT + paper_context}] + body.messages
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
