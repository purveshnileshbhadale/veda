"""
Multi-provider AI client supporting Gemini, Groq, OpenRouter, and DeepSeek.
All providers have free tiers or free models available.
"""
import json
import os
import httpx
from typing import Optional, List, Dict, Any, AsyncGenerator
from app.config import get_settings

settings = get_settings()

KEYS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "api_keys.json")

def _load_saved_keys() -> dict:
    try:
        if os.path.exists(KEYS_FILE):
            with open(KEYS_FILE) as f:
                return json.load(f)
    except:
        pass
    return {}

def _get_key(provider: str) -> Optional[str]:
    saved = _load_saved_keys()
    env_key = getattr(settings, f"{provider.upper()}_API_KEY", None)
    return saved.get(provider) or env_key

class AIClient:
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or settings.AI_PROVIDER
        self._client: Optional[Any] = None
        self._initialize_client()

    def _initialize_client(self):
        key = _get_key(self.provider)
        if not key:
            return

        if self.provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=key)
            self._client = genai
        elif self.provider == "groq":
            self._client = httpx.AsyncClient(
                base_url="https://api.groq.com/openai/v1",
                headers={"Authorization": f"Bearer {key}"}
            )
        elif self.provider == "openrouter":
            self._client = httpx.AsyncClient(
                base_url="https://openrouter.ai/api/v1",
                headers={
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "VEDA"
                }
            )
        elif self.provider == "deepseek":
            self._client = httpx.AsyncClient(
                base_url="https://api.deepseek.com/v1",
                headers={"Authorization": f"Bearer {key}"}
            )

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 4096) -> str:
        if self.provider == "gemini":
            return await self._chat_gemini(messages, temperature, max_tokens)
        elif self.provider in ("groq", "openrouter", "deepseek"):
            return await self._chat_openai_compat(messages, temperature, max_tokens)
        return "AI provider not configured. Please set an API key in settings."

    async def _chat_gemini(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
        try:
            model = self._client.GenerativeModel(
                settings.GEMINI_MODEL,
                generation_config={"temperature": temperature, "max_output_tokens": max_tokens}
            )
            system_prompt = ""
            chat_history = []
            for msg in messages:
                if msg["role"] == "system":
                    system_prompt = msg["content"]
                else:
                    chat_history.append({"role": msg["role"], "parts": [msg["content"]]})
            
            if system_prompt:
                chat_history.insert(0, {"role": "user", "parts": [f"System: {system_prompt}\n\n---\n\n"]})
            
            response = model.generate_content(chat_history)
            return response.text
        except Exception as e:
            return f"Error with Gemini API: {str(e)}"

    async def _chat_openai_compat(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
        model_map = {
            "groq": settings.GROQ_MODEL,
            "openrouter": settings.OPENROUTER_MODEL,
            "deepseek": settings.DEEPSEEK_MODEL,
        }
        model = model_map.get(self.provider, settings.GROQ_MODEL)
        try:
            response = await self._client.post(
                "/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error with {self.provider} API: {str(e)}"

    async def generate_embedding(self, text: str) -> list:
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(settings.EMBEDDING_MODEL)
            return model.encode(text).tolist()
        except Exception as e:
            return []

    async def analyze_paper(self, title: str, abstract: str) -> Dict[str, Any]:
        prompt = f"""Analyze this research paper and provide structured insights:
Title: {title}
Abstract: {abstract}

Provide a JSON response with:
1. key_findings (list of 3-5 main findings)
2. methodology (the research methodology used)
3. limitations (list of limitations)
4. future_work (suggested future research directions)
5. confidence_score (0-1)
6. keywords (list of relevant keywords)

Respond with ONLY valid JSON, no markdown formatting."""

        response = await self.chat([
            {"role": "system", "content": "You are a PhD-level research analyst. Analyze papers with precision."},
            {"role": "user", "content": prompt}
        ], temperature=0.3)
        
        try:
            cleaned = response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except:
            return {"key_findings": [], "methodology": "", "limitations": [], "future_work": [], "confidence_score": 0, "keywords": []}

    async def generate_research_idea(self, topic: str, context: str = "") -> Dict[str, Any]:
        prompt = f"""Generate novel research ideas for the topic: {topic}
Context: {context}

Provide a JSON response with:
1. research_question (a specific, novel research question)
2. hypothesis (testable hypothesis)
3. proposed_methodology (brief methodology)
4. expected_outcomes (what results might show)
5. innovation (what makes this novel)
6. related_fields (interdisciplinary connections)

Respond with ONLY valid JSON."""

        response = await self.chat([
            {"role": "system", "content": "You are an innovative research scientist who identifies novel research directions."},
            {"role": "user", "content": prompt}
        ], temperature=0.8)
        
        try:
            cleaned = response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except:
            return {"research_question": "", "hypothesis": "", "proposed_methodology": "", "expected_outcomes": "", "innovation": "", "related_fields": []}

    async def generate_paper_section(self, section_title: str, context: str, references: List[Dict] = None) -> str:
        ref_text = ""
        if references:
            ref_text = "\nReferences:\n" + "\n".join([f"- {r.get('title', '')} ({r.get('authors', '')})" for r in references])
        
        prompt = f"""Write the following section of an academic research paper:
Section: {section_title}
Context: {context}
{ref_text}

Write in formal academic style with proper citations. Be thorough and specific."""

        return await self.chat([
            {"role": "system", "content": "You are an academic paper writing assistant. Write in formal, publishable academic style."},
            {"role": "user", "content": prompt}
        ], temperature=0.5, max_tokens=8192)

    async def gap_analysis(self, topic: str, existing_papers: List[Dict] = None) -> Dict[str, Any]:
        papers_text = ""
        if existing_papers:
            papers_text = "\nExisting literature:\n" + "\n".join(
                [f"- {p.get('title', '')}: {p.get('abstract', '')[:200]}" for p in existing_papers[:10]]
            )
        
        prompt = f"""Perform a research gap analysis on: {topic}
{papers_text}

Provide a JSON response with:
1. identified_gaps (list of objects with: gap, description, significance, related_papers[])
2. opportunities (list of objects with: opportunity, potential_impact, feasibility)
3. recommendations (list of strings)
4. confidence (0-1)

Respond with ONLY valid JSON."""

        response = await self.chat([
            {"role": "system", "content": "You are a research methodology expert specializing in literature gap analysis."},
            {"role": "user", "content": prompt}
        ], temperature=0.4)
        
        try:
            cleaned = response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except:
            return {"identified_gaps": [], "opportunities": [], "recommendations": [], "confidence": 0}

    async def chat_stream(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """Streaming chat for interactive AI assistant."""
        if self.provider == "gemini":
            try:
                model = self._client.GenerativeModel(settings.GEMINI_MODEL)
                chat = model.start_chat()
                for msg in messages:
                    if msg["role"] == "user":
                        response = chat.send_message(msg["content"], stream=True)
                        for chunk in response:
                            if chunk.text:
                                yield chunk.text
            except Exception as e:
                yield f"Error: {str(e)}"
        else:
            model_map = {
                "groq": settings.GROQ_MODEL,
                "openrouter": settings.OPENROUTER_MODEL,
                "deepseek": settings.DEEPSEEK_MODEL,
            }
            model = model_map.get(self.provider, settings.GROQ_MODEL)
            try:
                async with self._client.stream(
                    "POST",
                    "/chat/completions",
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 4096,
                        "stream": True,
                    },
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data.strip() == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data)
                                if content := chunk.get("choices", [{}])[0].get("delta", {}).get("content"):
                                    yield content
                            except:
                                continue
            except Exception as e:
                yield f"Error: {str(e)}"

# Singleton instance
ai_client = AIClient()
