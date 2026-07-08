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
3. **Opening Speeches**: Write powerful 1-minute opening speeches for any country or official
4. **Speeches of Officials**: Write speeches for UN officials (Secretary-General, committee chairs, heads of state) with appropriate diplomatic tone and protocol
5. **Policy Research**: Summarize a country's stance, allies, and voting history on issues
6. **Working Papers**: Draft working papers that outline key arguments, proposals, and negotiating positions for committee discussion
7. **Deep Research**: Conduct thorough multi-aspect research on any topic — historical background, key stakeholders, legal frameworks, recent developments, statistical data, and competing perspectives
8. **Crisis Notes**: Draft short crisis communiques for crisis committees
9. **Amendments**: Suggest amendments to draft resolutions
10. **Clauses**: Write preambulatory and operative clauses in proper UN format
11. **Strategy**: Recommend blocs, negotiation tactics, and lobbying approaches
12. **Stance Analysis**: Provide detailed country stance analysis on any issue, including historical voting record, alliances, economic interests, and diplomatic priorities

Format resolutions properly with "The General Assembly/Economic and Social Council/Security Council," "Reaffirming...", "Noting with concern...", and numbered operative clauses ending with semicolons (last clause ends with period).

ALWAYS include the country's perspective. Use formal diplomatic language. Reference UN charter articles, past resolutions, and international law where relevant. For deep research, organize findings with clear headings and cite specific sources where possible.""",

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

    "experiment": """You are VEDA-Lab, a scientific experiment designer and simulation expert. Help researchers design experiments, simulate outcomes, and explore all possibilities.

Capabilities:
1. **Hypothesis Generation**: Formulate testable hypotheses with null and alternative forms
2. **Experimental Design**: Design controlled experiments (RCT, factorial, crossover, quasi-experimental)
3. **Variable Identification**: Identify independent, dependent, confounding, and control variables
4. **Simulation**: Simulate possible experimental outcomes across different scenarios
5. **Statistical Planning**: Recommend appropriate statistical tests (t-test, ANOVA, chi-square, regression, Bayesian)
6. **Sample Size Calculation**: Determine required sample size for statistical power
7. **Counterfactual Analysis**: Explore "what if" scenarios — what would happen if variables changed
8. **Monte Carlo Simulation**: Describe how Monte Carlo methods could model the system
9. **A/B Testing**: Design and analyze A/B tests with proper randomization and significance thresholds
10. **Threats to Validity**: Identify internal, external, construct, and statistical conclusion validity threats
11. **Assumption Checking**: List assumptions of proposed methods and how to verify them
12. **Sensitivity Analysis**: Suggest sensitivity analyses to test robustness of findings

When simulating, be explicit about assumptions, parameters, and limitations. Use clear scenarios with input variables, expected outcomes, and confidence intervals where applicable.

Think like a senior experimental scientist. Be rigorous about methodology. Challenge weak designs. Suggest improvements. Always consider multiple possible outcomes, not just the expected one.""",
}

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    mode: str = "research"
    api_key: Optional[str] = None
    provider: Optional[str] = None

class HumanizeRequest(BaseModel):
    text: str
    api_key: Optional[str] = None
    provider: Optional[str] = None

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
    client = AIClient(provider=body.provider, api_key=body.api_key)
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
    from app.core.ai_client import AIClient
    client = AIClient(api_key=body.api_key)
    prompt = f"""Rewrite the following text to sound more natural and human-like, as if written by an experienced researcher rather than an AI. Vary sentence structure, use natural transitions, and avoid robotic or repetitive phrasing. Keep the same information and academic tone, but make it flow naturally.
 
 Text to humanize:
 {body.text}"""
    result = await client.chat([{"role": "system", "content": "You are an expert at making AI-generated academic text sound natural and human-like."}, {"role": "user", "content": prompt}])
    return {"result": result}

class GeneratePaperRequest(BaseModel):
    topic: str
    api_key: Optional[str] = None
    provider: Optional[str] = None

@router.post("/generate-paper")
async def generate_paper(body: GeneratePaperRequest, current_user: User = Depends(get_current_user)):
    papers = await fetch_arxiv_papers(body.topic, 8)
    refs = ""
    if papers:
        refs = f"\n\nUse these real papers as references. Cite them in the text and include them in the reference list:\n{papers}"

    client = AIClient(api_key=body.api_key)
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

class FindMUNDocRequest(BaseModel):
    doc_type: str  # speech, resolution, working_paper, position_paper, stance, deep_research
    topic: str
    country: Optional[str] = None
    api_key: Optional[str] = None

async def fetch_wikipedia(query: str, max_results: int = 3) -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&srlimit={max_results}"
            resp = await c.get(search_url)
            if resp.status_code != 200:
                return ""
            data = resp.json()
            pages = data.get("query", {}).get("search", [])
            results = []
            for page in pages[:max_results]:
                title = page.get("title", "")
                page_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles={title}&format=json"
                pr = await c.get(page_url)
                if pr.status_code != 200:
                    continue
                pd = pr.json()
                pages_data = pd.get("query", {}).get("pages", {})
                for pid, info in pages_data.items():
                    extract = info.get("extract", "")[:2000]
                    if extract:
                        results.append(f"--- {title} ---\n{extract}")
            return "\n\n".join(results) if results else ""
    except:
        return ""

FINDPROMPTS = {
    "speech": "Find and summarize real speeches delivered by officials on this topic. Include who gave them, when, where, and key quotes or talking points.",
    "resolution": "Find and describe real UN resolutions related to this topic. Include resolution numbers, year adopted, key provisions, and voting records.",
    "position_paper": "Research the actual stated positions of key countries/stakeholders on this issue. Cite official statements, policy documents, or diplomatic communications.",
    "working_paper": "Research real working papers, reports, or draft documents produced by UN bodies, think tanks, or governments on this topic. Summarize their key findings.",
    "stance": "Analyze the actual stances of major powers on this issue. Include official policy positions, recent statements, alliances, and voting patterns in UN bodies.",
    "deep_research": "Conduct thorough research on this topic using available sources. Cover historical background, key stakeholders, legal frameworks, recent developments, statistical data, and competing perspectives.",
}

@router.post("/find-mun-doc")
async def find_mun_doc(body: FindMUNDocRequest, current_user: User = Depends(get_current_user)):
    wiki_query = f"{body.topic} {' '.join(body.country.split()[:3]) if body.country else ''} United Nations"
    wiki_context = await fetch_wikipedia(wiki_query)

    find_prompt = FINDPROMPTS.get(body.doc_type, "Research this topic thoroughly.")
    context = ""
    if wiki_context:
        context = f"\n\nHere is real information from Wikipedia that you MUST use as source material. Reference specific facts, figures, and details from this context in your response:\n{wiki_context}"

    system = f"""You are VEDA-MUN Research, an expert at finding and analyzing real MUN-related documents and information.

{find_prompt}

ALWAYS ground your response in real facts. If you reference specific documents, include names, dates, and relevant details. Use formal diplomatic language. Organize your response with clear headings."""

    user_prompt = f"Find information about: {body.topic}"
    if body.country:
        user_prompt += f"\nCountry/Stakeholder: {body.country}"
    user_prompt += context

    client = AIClient(api_key=body.api_key)
    result = await client.chat([
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ])
    return {"result": result}

class GenerateVideoScriptRequest(BaseModel):
    title: str
    authors: str = ""
    abstract: str = ""
    findings: str = ""
    conclusion: str = ""
    api_key: Optional[str] = None
    provider: Optional[str] = None

@router.post("/generate-video-script")
async def generate_video_script(body: GenerateVideoScriptRequest, current_user: User = Depends(get_current_user)):
    system = """You are VEDA-Video, an expert at creating narrated research video scripts.
Given a research paper's details, produce a structured JSON script for a 60-90 second animated research summary video.

Return ONLY valid JSON with this exact structure:
{
  "slides": [
    {
      "type": "title",
      "heading": "Paper Title",
      "subheading": "Authors",
      "narration": "Narrator script for this slide (1-2 sentences)"
    },
    {
      "type": "abstract",
      "heading": "Overview",
      "bullets": ["bullet point 1", "bullet point 2", "bullet point 3"],
      "narration": "Narrator script for this slide"
    },
    {
      "type": "findings",
      "heading": "Key Findings",
      "bullets": ["finding 1", "finding 2", "finding 3", "finding 4"],
      "narration": "Narrator script for this slide"
    },
    {
      "type": "conclusion",
      "heading": "Conclusion & Impact",
      "bullets": ["conclusion point 1", "conclusion point 2"],
      "narration": "Narrator script for this slide"
    }
  ]
}

Keep narration concise (1-2 sentences per slide). Use clear, professional language suitable for academic narration. Each slide should have 2-4 bullets maximum. Make the video script flow naturally from introduction to conclusion."""

    content = f"Title: {body.title}\nAuthors: {body.authors}\nAbstract: {body.abstract}\nKey Findings: {body.findings}\nConclusion: {body.conclusion}"
    client = AIClient(api_key=body.api_key)
    result = await client.chat([
        {"role": "system", "content": system},
        {"role": "user", "content": content},
    ])
    # Try to parse JSON from result
    import re, json
    json_match = re.search(r'\{.*\}', result, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            return {"script": parsed}
        except:
            pass
    return {"script": {"slides": [
        {"type": "title", "heading": body.title, "subheading": body.authors, "narration": "In this research, we explore an important topic."},
        {"type": "abstract", "heading": "Overview", "bullets": [body.abstract[:100] + "..."], "narration": "This study addresses key questions in the field."},
        {"type": "findings", "heading": "Key Findings", "bullets": [body.findings[:100] + "..."], "narration": "Our findings reveal significant insights."},
        {"type": "conclusion", "heading": "Conclusion", "bullets": [body.conclusion[:100] + "..."], "narration": "This work has important implications for future research."}
    ]}}
