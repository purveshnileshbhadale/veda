
# VEDA — Virtual Engine for Discovery & Analysis

**Transforming Knowledge into Discovery.**

VEDA is a next-generation AI Scientist platform that accelerates scientific research through artificial intelligence. Built as a desktop application, it helps researchers throughout the entire research lifecycle — from literature discovery to paper publication.

> **Free AI APIs**: Works with Gemini, Groq, OpenRouter, and DeepSeek — all have free tiers available.

---

## Architecture

```
VEDA/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS
│   └── src/
│       ├── app/           # Pages & routes
│       ├── components/    # UI components (shadcn/ui style)
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utilities & API client
│       └── types/         # TypeScript type definitions
│
├── backend/           # Python FastAPI + SQLAlchemy
│   └── app/
│       ├── api/           # REST API routes (7 modules)
│       ├── agents/        # AI agent system (4 specialized agents)
│       ├── core/          # Security, AI client, config
│       ├── models/        # SQLAlchemy models (16 tables)
│       ├── schemas/       # Pydantic request/response schemas
│       └── services/      # Business logic (6 services)
│
├── scripts/           # Setup & initialization scripts
├── docker-compose.yml # Container orchestration
└── .env.example       # Environment configuration
```

## Key Features

| Module | Capabilities |
|--------|-------------|
| **Literature Management** | Search papers, upload PDFs, arXiv integration, AI-powered analysis, collections |
| **Knowledge Graphs** | Concept mapping, relationship extraction, research gap analysis, trend identification |
| **Experiment Design** | Design experiments, track variables, record results, AI methodology suggestions |
| **Paper Writing** | AI-assisted writing, section generation, reference management, export to TXT/PDF |
| **AI Assistant** | Chat interface, paper analysis, research idea generation, streaming responses |
| **Dashboard** | Research overview, recent activity, quick actions, progress tracking |

## AI Providers (Free APIs)

- **Google Gemini** — `gemini-1.5-flash` (free tier: 60 requests/min)
- **Groq** — `mixtral-8x7b-32768` (free tier: 30 req/min, 14400 req/day)
- **OpenRouter** — Multiple models (free tier available)
- **DeepSeek** — `deepseek-chat` (free tier: tokens for experimentation)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm or yarn

### 1. Clone and setup environment
```bash
cp .env.example .env
# Edit .env to add your preferred AI API key
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open in browser
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/health
- **API Docs**: http://localhost:8000/docs

## Docker Setup

```bash
docker-compose up -d
```

This starts: backend (FastAPI), frontend (Next.js), PostgreSQL (with pgvector), Redis, ChromaDB.

## Desktop Application

VEDA is designed as a desktop-first application:
- Runs entirely on your local machine
- No cloud dependency required
- Your data stays private
- Works offline (after initial setup)

To bundle as a desktop app:
```bash
cd frontend
npm install -g @tauri-apps/cli
cargo tauri init
npm run tauri build
```

## API Overview

All API routes are under `/api/v1/`:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/auth/*` | POST, GET | Register, login, profile |
| `/literature/*` | GET, POST | Search papers, upload, collections |
| `/knowledge/*` | GET, POST | Concepts, graphs, gap analysis |
| `/experiments/*` | GET, POST | CRUD experiments, variables, results |
| `/papers/*` | GET, POST | Manuscripts, sections, AI generation, export |
| `/ai/*` | POST | Chat, stream, paper analysis, idea generation |
| `/dashboard` | GET | Aggregate research statistics |

## Technology Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI, Recharts, Sonner

**Backend**: Python FastAPI, SQLAlchemy 2.0, Pydantic v2, LangChain integration

**Database**: SQLite (default) or PostgreSQL + pgvector

**AI**: Multi-provider support (Gemini, Groq, OpenRouter, DeepSeek)

**Auth**: JWT-based with bcrypt password hashing

## Project Structure Details

### Backend Models (16 tables)
- `users`, `user_profiles` — User management
- `papers`, `paper_authors`, `citations`, `paper_collections` — Literature
- `concepts`, `knowledge_graphs`, `graph_edges`, `research_topics` — Knowledge
- `experiments`, `experiment_variables`, `experiment_results` — Experiments
- `manuscripts`, `manuscript_sections`, `manuscript_references` — Papers

### AI Agents (4 specialized)
- `LiteratureAgent` — Summarize, extract methods, find related work
- `GapAnalysisAgent` — Identify research gaps, trends, novelty evaluation
- `PaperWriterAgent` — Write sections/abstracts, suggest titles, format references
- `ExperimentAgent` — Design experiments, analyze results, suggest controls

## License

MIT License — free to use, modify, and distribute.
