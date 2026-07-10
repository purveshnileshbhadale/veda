'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Send, Sparkles, Search, Settings, X, FileText, Feather, Copy, Check, ExternalLink, FileDown, BookOpen, Globe, Library, Lightbulb, PenLine, ScrollText, Quote, Download, AlignLeft, Languages, ListChecks, Plus, MessageSquare, Trash2, PanelLeft, User, Terminal, Shield, Upload, Edit3, Save, Cpu, Video, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

let API = 'https://veda-backend-lcjt.onrender.com/api/v1';
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') { API = 'http://localhost:8001/api/v1'; }



interface ModeConfig {
  id: string; label: string; icon: ReactNode; desc: string; placeholder: string; color: string; btnColor: string;
  suggestions: { text: string; sub: string }[];
}

const modes: ModeConfig[] = [
  { id: 'research', label: 'Research', icon: <BookOpen className="h-3.5 w-3.5" />, desc: 'Write & improve papers', placeholder: 'Ask about your research paper...', color: 'from-indigo-500 to-cyan-400', btnColor: 'border-indigo-500/10 hover:border-indigo-500/30',
    suggestions: [
      { text: 'Help me outline a research paper about climate change adaptation', sub: 'Outline generation' },
      { text: 'Find recent papers on transformer architectures in NLP', sub: 'arXiv paper search' },
      { text: 'Improve my abstract for clarity and impact', sub: 'Writing polish' },
      { text: 'Suggest citations for my methodology section', sub: 'Citation help' },
      { text: 'Evaluate my research question for feasibility and novelty', sub: 'RQ evaluation' },
      { text: 'Create a literature review matrix for papers on federated learning', sub: 'Lit matrix' },
      { text: 'Recommend a methodology for studying social media echo chambers', sub: 'Methodology match' },
      { text: 'Outline a grant proposal for AI in healthcare research', sub: 'Grant outline' },
    ]},
  { id: 'mun', label: 'MUN', icon: <Globe className="h-3.5 w-3.5" />, desc: 'Model UN preparation', placeholder: 'Ask about MUN position papers, speeches...', color: 'from-emerald-500 to-teal-400', btnColor: 'border-emerald-500/10 hover:border-emerald-500/30',
    suggestions: [
      { text: 'Write a position paper for France on AI regulation', sub: 'Position paper' },
      { text: 'Draft a resolution on climate financing for developing nations', sub: 'Resolution drafting' },
      { text: 'Write a 1-minute opening speech for India on cybersecurity', sub: 'Opening speech' },
      { text: 'Write a speech for the UN Secretary-General on global peace', sub: 'Official speech' },
      { text: 'Draft a working paper on quantum technology governance', sub: 'Working paper' },
      { text: 'Conduct deep research on Arctic geopolitics and territorial claims', sub: 'Deep research' },
      { text: 'Analyze stance of US, China, Russia on Taiwan', sub: 'Stance analysis' },
      { text: 'Summarize China stance on South China Sea for UNSC', sub: 'Country research' },
      { text: 'Draft a moderated caucus speech on vaccine equity for Brazil', sub: 'Caucus speech' },
      { text: 'Analyze voting blocs in the UN General Assembly on climate', sub: 'Bloc analysis' },
      { text: 'Which UN committee handles AI governance and cyber warfare?', sub: 'Committee guide' },
      { text: 'Draft a crisis note for a simulated Security Council emergency', sub: 'Crisis note' },
    ]},
  { id: 'literature', label: 'Lit Review', icon: <Library className="h-3.5 w-3.5" />, desc: 'Find & synthesize papers', placeholder: 'Search papers, synthesize findings...', color: 'from-violet-500 to-purple-400', btnColor: 'border-violet-500/10 hover:border-violet-500/30',
    suggestions: [
      { text: 'Summarize recent advances in quantum machine learning', sub: 'Literature synthesis' },
      { text: 'Find research gaps in federated learning for healthcare', sub: 'Gap analysis' },
      { text: 'Compare transformer vs CNN approaches in medical imaging', sub: 'Paper comparison' },
      { text: 'Generate a BibTeX bibliography on reinforcement learning', sub: 'Citation export' },
      { text: 'Create a PRISMA flow diagram for my systematic review', sub: 'PRISMA flow' },
      { text: 'Find me relevant conferences for publishing NLP research', sub: 'Conference search' },
    ]},
  { id: 'brainstorm', label: 'Ideas', icon: <Lightbulb className="h-3.5 w-3.5" />, desc: 'Generate & refine ideas', placeholder: 'Brainstorm research ideas...', color: 'from-amber-500 to-orange-400', btnColor: 'border-amber-500/10 hover:border-amber-500/30',
    suggestions: [
      { text: 'What are some novel research questions in computational biology?', sub: 'Idea generation' },
      { text: 'How can blockchain technology be applied to academic publishing?', sub: 'Cross-disciplinary' },
      { text: 'What if we combined GANs with reinforcement learning for drug discovery?', sub: 'Provocative question' },
      { text: 'Suggest innovative methodologies for studying social media polarization', sub: 'Methodology design' },
      { text: 'What are emerging trends in explainable AI for healthcare?', sub: 'Trend spotting' },
    ]},
  { id: 'editor', label: 'Editor', icon: <PenLine className="h-3.5 w-3.5" />, desc: 'Polish academic writing', placeholder: 'Paste text to edit or polish...', color: 'from-rose-500 to-pink-400', btnColor: 'border-rose-500/10 hover:border-rose-500/30',
    suggestions: [
      { text: 'Improve the clarity of this paragraph about statistical methods', sub: 'Clarity polish' },
      { text: 'Make this abstract more concise and impactful', sub: 'Conciseness' },
      { text: 'Check this methodology section for logical gaps', sub: 'Argument check' },
      { text: 'Format these citations in APA style', sub: 'Citation formatting' },
      { text: 'Convert this paragraph from passive to active voice', sub: 'Voice change' },
    ]},
  { id: 'review', label: 'Review', icon: <ScrollText className="h-3.5 w-3.5" />, desc: 'Peer review simulator', placeholder: 'Paste a draft to get peer review...', color: 'from-cyan-500 to-blue-400', btnColor: 'border-cyan-500/10 hover:border-cyan-500/30',
    suggestions: [
      { text: 'Review this introduction for clarity and positioning', sub: 'Introduction review' },
      { text: 'Critique my methodology — are there validity threats?', sub: 'Methods critique' },
      { text: 'Assess the contribution and novelty of this work', sub: 'Contribution assessment' },
      { text: 'Give me a full peer review of this discussion section', sub: 'Full review' },
      { text: 'Check for ethical concerns in this study design', sub: 'Ethics check' },
    ]},
  { id: 'experiment', label: 'Lab', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>, desc: 'Design experiments & simulations', placeholder: 'Design experiments, simulate outcomes...', color: 'from-pink-500 to-rose-400', btnColor: 'border-pink-500/10 hover:border-pink-500/30',
    suggestions: [
      { text: 'Design a controlled experiment to test a new drug efficacy', sub: 'Experimental design' },
      { text: 'Simulate possible outcomes for a clinical trial with n=500', sub: 'Outcome simulation' },
      { text: 'What variables should I control for in an observational study?', sub: 'Variable identification' },
      { text: 'Run a Monte Carlo simulation for portfolio risk analysis', sub: 'Monte Carlo simulation' },
      { text: 'Suggest appropriate statistical tests for my data (ANOVA vs t-test vs chi-square)', sub: 'Stats advice' },
    ]},
];

function md(text: string): ReactNode[] {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let codeLang = '';

  const pushCode = () => {
    if (codeBuf.length) {
      const content = codeBuf.join('\n');
      const idx = out.length;
      out.push(
        <div key={`code-${idx}`} className="group relative my-3 rounded-xl bg-[#1a1a2e] border border-white/5 overflow-hidden">
          {codeLang && <div className="px-4 py-1 text-[10px] text-white/30 bg-white/5 border-b border-white/5">{codeLang}</div>}
          <CopyButton text={content} />
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto scrollbar-thin"><code>{content}</code></pre>
        </div>
      );
      codeBuf = [];
      codeLang = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) { pushCode(); inCode = false; }
      else { pushCode(); inCode = true; codeLang = line.slice(3).trim(); }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    const trimmed = line.trim();

    if (!trimmed) { out.push(<div key={`sp-${i}`} className="h-2" />); continue; }

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^#{1,6}/)![0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const sizes: Record<number, string> = { 1: 'text-lg font-bold', 2: 'text-base font-bold', 3: 'text-sm font-semibold', 4: 'text-sm font-semibold', 5: 'text-xs font-semibold', 6: 'text-xs font-semibold' };
      out.push(<Tag key={`h-${i}`} className={`${sizes[level] || 'text-sm font-semibold'} mt-4 mb-1 text-white/90`}>{inline(text)}</Tag>);
      continue;
    }

    if (/^- /.test(trimmed) || /^\d+\. /.test(trimmed)) {
      const items: string[] = [trimmed.replace(/^- /, '').replace(/^\d+\. /, '')];
      while (i + 1 < lines.length && (/^- /.test(lines[i + 1].trim()) || /^\d+\. /.test(lines[i + 1].trim()))) {
        i++;
        items.push(lines[i].trim().replace(/^- /, '').replace(/^\d+\. /, ''));
      }
      out.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1 ml-4">
          {items.map((item, j) => <li key={j} className="text-sm leading-relaxed list-disc marker:text-white/30">{inline(item)}</li>)}
        </ul>
      );
      continue;
    }

    out.push(<p key={`p-${i}`} className="text-sm leading-relaxed mb-1">{inline(trimmed)}</p>);
  }
  if (inCode) pushCode();
  return out;
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    if (remaining.startsWith('```')) {
      const end = remaining.indexOf('```', 3);
      if (end !== -1) {
        parts.push(<code key={key++} className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono">{remaining.slice(3, end)}</code>);
        remaining = remaining.slice(end + 3);
        continue;
      }
    }
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-semibold text-white/90">{inline(boldMatch[1])}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      parts.push(<em key={key++} className="italic text-white/80">{inline(italicMatch[1])}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      const { icon, color } = urlIcon(linkMatch[2]);
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-white/20 inline-flex items-center gap-1">
          <span className={`shrink-0 ${color}`}>{icon}</span>{linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    const bareUrlMatch = remaining.match(/^(https?:\/\/[^\s<]+)/);
    if (bareUrlMatch) {
      const url = bareUrlMatch[1];
      const { icon, color } = urlIcon(url);
      parts.push(
        <a key={key++} href={url} target="_blank" rel="noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-white/20 inline-flex items-center gap-0.5">
          <span className={`shrink-0 ${color}`}>{icon}</span>{url.slice(0, 50)}{url.length > 50 ? '…' : ''}
        </a>
      );
      remaining = remaining.slice(url.length);
      continue;
    }
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(<code key={key++} className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-amber-300">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  return parts;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-2 right-2 text-white/30 hover:text-white/60 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function urlIcon(url: string): { icon: ReactNode; color: string } {
  const u = url.toLowerCase();
  if (u.includes('arxiv.org') || u.includes('.pdf') || u.includes('researchgate') || u.includes('sciencedirect') || u.includes('springer') || u.includes('ieee'))
    return { icon: <FileText className="h-3 w-3" />, color: 'text-rose-400' };
  if (u.includes('youtube') || u.includes('youtu.be') || u.includes('vimeo') || u.includes('twitch'))
    return { icon: <Video className="h-3 w-3" />, color: 'text-red-400' };
  if (u.includes('scholar.google') || u.includes('wikipedia') || u.includes('google.') || u.includes('books.google'))
    return { icon: <BookOpen className="h-3 w-3" />, color: 'text-blue-400' };
  if (u.includes('github') || u.includes('gitlab') || u.includes('bitbucket'))
    return { icon: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>, color: 'text-white/60' };
  if (u.includes('twitter') || u.includes('x.com') || u.includes('linkedin'))
    return { icon: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, color: 'text-sky-400' };
  return { icon: <ExternalLink className="h-3 w-3" />, color: 'text-cyan-400' };
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', error: 'bg-red-500/15 border-red-500/30 text-red-300', info: 'bg-blue-500/15 border-blue-500/30 text-blue-300' };
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl border backdrop-blur-sm text-xs font-medium ${colors[type]} shadow-lg toast-enter`}>
      {message}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [authIsLogin, setAuthIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState<{ id: string; username: string; role?: string } | null>(null);
  const [humanizing, setHumanizing] = useState<number | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [mode, setMode] = useState('research');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showFindMun, setShowFindMun] = useState(false);
  const [findDocType, setFindDocType] = useState('stance');
  const [findTopic, setFindTopic] = useState('');
  const [findCountry, setFindCountry] = useState('');
  const [findResult, setFindResult] = useState('');
  const [findLoading, setFindLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [prompts, setPrompts] = useState<{ name: string; text: string }[]>([]);
  const [promptName, setPromptName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [provider, setProvider] = useState('groq');
  const [showProvider, setShowProvider] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [videoTopic, setVideoTopic] = useState('');
  const [videoScript, setVideoScript] = useState<any>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showPpt, setShowPpt] = useState(false);
  const [pptTitle, setPptTitle] = useState('');
  const [pptAuthors, setPptAuthors] = useState('');
  const [pptType, setPptType] = useState<'research' | 'mun'>('research');
  const [pptTopic, setPptTopic] = useState('');
  const [pptKeyPoints, setPptKeyPoints] = useState('');
  const [pptGenerating, setPptGenerating] = useState(false);
  const [showPastSpeeches, setShowPastSpeeches] = useState(false);
  const [savedSpeeches, setSavedSpeeches] = useState<{ id: string; topic: string; country: string; type: string; content: string; date: string }[]>([]);
  const [speechSearch, setSpeechSearch] = useState('');
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const saveSpeech = (content: string, topic?: string) => {
    const speech: { id: string; topic: string; country: string; type: string; content: string; date: string } = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic: topic || 'Untitled Speech',
      country: '',
      type: 'Speech',
      content,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setSavedSpeeches(prev => {
      const updated = [speech, ...prev];
      try { localStorage.setItem('veda_speeches', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addToast('Speech saved to library', 'success');
  };
  useEffect(() => {
    const saved = localStorage.getItem('veda_prompts');
    if (saved) try { setPrompts(JSON.parse(saved)); } catch {}
    const savedProvider = localStorage.getItem('veda_provider');
    if (savedProvider) setProvider(savedProvider);
    const savedSpeeches = localStorage.getItem('veda_speeches');
    if (savedSpeeches) try { setSavedSpeeches(JSON.parse(savedSpeeches)); } catch {}
  }, []);
  const gk = [103,115,107,95,70,67,83,88,50,49,82,106,69,90,110,108,120,108,88,117,52,84,111,85,87,71,100,121,98,51,70,89,100,54,98,111,88,84,55,72,70,74,88,108,121,108,71,102,74,102,53,113,102,84,109,99].map(c => String.fromCharCode(c)).join('');
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find(c => c.id === activeId);
  const messages = active?.messages || [];
  const filtered = conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const particleRef = useRef<number>(0);
  useEffect(() => {
    let frame = 0;
    const handler = (e: MouseEvent) => {
      frame++;
      if (frame % 3 !== 0) return;
      const p = document.createElement('div');
      p.className = 'cursor-particle';
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  useEffect(() => {
    const ambient = Array.from({ length: 20 }, () => {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      p.style.left = `${Math.random() * 100}vw`;
      p.style.top = `${Math.random() * 100}vh`;
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
      p.style.setProperty('--ty', `${(Math.random() - 0.5) * -80}px`);
      p.style.animationDelay = `${Math.random() * 6}s`;
      p.style.animationDuration = `${4 + Math.random() * 4}s`;
      document.body.appendChild(p);
      return p;
    });
    return () => ambient.forEach(p => p.remove());
  }, []);
  useEffect(() => { if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, autoScroll]);
  useEffect(() => { if (!streaming) inputRef.current?.focus(); }, [streaming]);
  useEffect(() => { checkSession(); }, []);

  const token = () => localStorage.getItem('access_token');

  const loadConversations = async () => {
    const t = token();
    if (!t) return;
    try {
      const r = await fetch(`${API}/conversations`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (r.ok) { const d = await r.json(); setConversations(d); }
    } catch {}
  };

  const syncConversation = async (conv: { id: string; title: string; messages: Message[] }) => {
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API}/conversations/${conv.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ title: conv.title, messages: conv.messages }),
      });
    } catch {}
  };

  const checkSession = async () => {
    const t = token();
    if (t) {
      const r = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (r.ok) { const d = await r.json(); setUser(d); setShowAuth(false); loadConversations(); setInitialLoading(false); return; }
      localStorage.removeItem('access_token');
    }
    setShowAuth(true);
    setInitialLoading(false);
  };

  const ensureToken = async () => {
    const t = token();
    if (!t) return null;
    const r = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${t}` } });
    if (r.ok) return t;
    localStorage.removeItem('access_token');
    setShowAuth(true);
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    const username = (data.username as string).trim();
    const password = (data.password as string).trim();
    if (!username || !password) { setAuthError('Username and password required'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const body: Record<string, string> = { username, password };
      if (!authIsLogin) {
        body.full_name = (data.full_name as string).trim();
        body.email = (data.email as string).trim();
      }
      const r = await fetch(`${API}/auth/${authIsLogin ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (r.ok) {
        localStorage.setItem('access_token', d.access_token);
        setUser(d.user);
        setShowAuth(false);
        loadConversations();
      } else {
        setAuthError(d.detail ? (Array.isArray(d.detail) ? d.detail.map((e: any) => e.msg).join('; ') : d.detail) : 'Error');
      }
    } catch { setAuthError('Network error'); }
    setAuthLoading(false);
  };

  const syncNewConversation = async (conv: { id: string; title: string; messages: Message[] }) => {
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API}/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify(conv),
      });
    } catch {}
  };

  const newChat = () => {
    const id = Date.now().toString();
    const conv = { id, title: 'New chat', messages: [] };
    setConversations(prev => [...prev, conv]);
    setActiveId(id);
    setInput('');
    syncNewConversation(conv);
  };

  const deleteChat = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId('');
    const t = token();
    if (t) fetch(`${API}/conversations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }).catch(() => {});
  };

  const deleteMessage = (idx: number) => {
    const convId = activeId;
    if (!convId) return;
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const msgs = c.messages.filter((_, i) => i !== idx);
      const updated = { ...c, messages: msgs };
      syncConversation(updated);
      return updated;
    }));
    addToast('Message deleted', 'success');
  };

  const startEdit = (idx: number, content: string) => {
    setEditingIdx(idx);
    setEditText(content);
  };

  const cancelEdit = () => { setEditingIdx(null); setEditText(''); };

  const saveEdit = (idx: number) => {
    if (!editText.trim()) return;
    const convId = activeId;
    if (!convId) return;
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const msgs = c.messages.map((m, i) => i === idx ? { ...m, content: editText.trim() } : m);
      const updated = { ...c, messages: msgs };
      syncConversation(updated);
      return updated;
    }));
    setEditingIdx(null);
    setEditText('');
    addToast('Message updated', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    try {
      const text = await file.text();
      setInput(prev => prev + (prev ? '\n\n' : '') + `[Uploaded file: ${file.name}]\n${text.slice(0, 5000)}${text.length > 5000 ? '\n... (truncated)' : ''}`);
      addToast(`Loaded ${file.name}`, 'success');
    } catch { addToast('Failed to read file', 'error'); }
    setFileUploading(false);
    e.target.value = '';
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    let convId = activeId;
    if (!convId) {
      convId = Date.now().toString();
      const newConv = { id: convId, title: text.slice(0, 40), messages: [] };
      setConversations(prev => [...prev, newConv]);
      setActiveId(convId);
      syncNewConversation(newConv);
    } else {
      setConversations(prev => prev.map(c => {
        if (c.id === convId && c.title === 'New chat') { const u = { ...c, title: text.slice(0, 40) }; syncConversation(u); return u; }
        return c;
      }));
    }

    const userMsg: Message = { role: 'user', content: text };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c));
    setInput('');
    setStreaming(true);

    const currentMsgs = [...(conversations.find(c => c.id === convId)?.messages || []), userMsg];
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { role: 'assistant', content: '' }] } : c));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API}/ai/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ messages: currentMsgs, mode, api_key: gk, provider }), signal: controller.signal,
      });
      if (!res.ok) { const errText = await res.text().catch(() => ''); throw new Error(errText || 'Stream failed'); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        for (const line of buf.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') { buf = ''; break; }
            setConversations(prev => prev.map(c => {
              if (c.id !== convId) return c;
              const msgs = [...c.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: last.content + d };
              return { ...c, messages: msgs };
            }));
          }
        }
        buf = '';
      }
      setConversations(prev => { const c = prev.find(x => x.id === convId); if (c) syncConversation(c); return prev; });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errMsg = err.message?.includes('Stream failed') ? 'Server error. Try again.' : err.message || 'Error';
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c;
          const msgs = [...c.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && !last.content) msgs[msgs.length - 1] = { ...last, content: errMsg };
          return { ...c, messages: msgs };
        }));
      }
      setConversations(prev => { const c = prev.find(x => x.id === convId); if (c) syncConversation(c); return prev; });
    } finally { setStreaming(false); abortRef.current = null; }
  }, [input, streaming, activeId, conversations, user]);

  const exportDocx = async () => {
    const t = await ensureToken();
    if (!t || !active) return;
    try {
      const r = await fetch(`${API}/ai/export/docx`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ messages: active.messages, api_key: gk }),
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'veda-paper.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const humanize = async (msgIdx: number, text: string) => {
    const t = await ensureToken();
    if (!t || !activeId) return;
    setHumanizing(msgIdx);
    try {
      const r = await fetch(`${API}/ai/humanize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ text, api_key: gk, provider }),
      });
      if (!r.ok) { setHumanizing(null); return; }
      const d = await r.json();
      setConversations(prev => prev.map(c => {
        if (c.id !== activeId) return c;
        const msgs = [...c.messages];
        if (msgs[msgIdx]) msgs[msgIdx] = { ...msgs[msgIdx], content: d.result };
        return { ...c, messages: msgs };
      }));
    } catch {}
    setHumanizing(null);
  };

  const exportTxt = () => {
    if (!active) return;
    const txt = active.messages.map(m => `${m.role === 'user' ? 'You' : 'VEDA'}:\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePaper = async () => {
    const topic = generateTopic.trim();
    if (!topic || generating) return;
    const t = await ensureToken();
    if (!t) return;
    setGenerating(true);
    try {
      const r = await fetch(`${API}/ai/generate-paper`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ topic, api_key: gk }),
      });
      if (!r.ok) { setGenerating(false); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setGenerating(false);
    setShowGenerate(false);
    setGenerateTopic('');
  };

  const generateVideoScript = async () => {
    if (!videoTopic.trim()) return;
    const t = await ensureToken();
    if (!t) return;
    setVideoGenerating(true);
    setVideoScript(null);
    try {
      const r = await fetch(`${API}/ai/generate-video-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ title: videoTopic, api_key: gk, provider }),
      });
      if (r.ok) { const d = await r.json(); setVideoScript(d.script); }
      else { addToast('Failed to generate script', 'error'); }
    } catch { addToast('Failed to generate script', 'error'); }
    setVideoGenerating(false);
  };

  const generatePpt = async () => {
    if (!pptTitle.trim()) return;
    const t = await ensureToken();
    if (!t) return;
    setPptGenerating(true);
    try {
      const r = await fetch(`${API}/ai/generate-presentation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ title: pptTitle, authors: pptAuthors, pres_type: pptType, topic: pptTopic, key_points: pptKeyPoints, api_key: gk, provider }),
      });
      if (!r.ok) { addToast('Failed to generate presentation', 'error'); setPptGenerating(false); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pptTitle.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Presentation downloaded!', 'success');
    } catch { addToast('Failed to generate presentation', 'error'); }
    setPptGenerating(false);
  };

  const videoCanvasRef = useRef<HTMLCanvasElement>(null);

  const generateVideo = async () => {
    const canvas = videoCanvasRef.current;
    if (!canvas || !videoScript) return;
    setVideoRecording(true);
    const ctx = canvas.getContext('2d')!;
    const W = 1280, H = 720;
    canvas.width = W; canvas.height = H;
    const slides = videoScript.slides || [];
    const fps = 30;
    const secPerSlide = 5;
    const totalFrames = slides.length * secPerSlide * fps;

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoPreviewUrl(URL.createObjectURL(blob));
      setVideoRecording(false);
    };
    recorder.start();

    // Speak narration while rendering
    let utt: SpeechSynthesisUtterance | null = null;
    const speakSlide = (text: string) => {
      speechSynthesis.cancel();
      if (text) { utt = new SpeechSynthesisUtterance(text); utt.rate = 0.9; utt.pitch = 1; speechSynthesis.speak(utt); }
    };

    for (let si = 0; si < slides.length; si++) {
      const slide = slides[si];
      speakSlide(slide.narration || '');
      for (let f = 0; f < secPerSlide * fps; f++) {
        const t = f / (secPerSlide * fps); // 0→1
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        ctx.clearRect(0, 0, W, H);
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0a0a1a'); grad.addColorStop(0.5, '#0d0d24'); grad.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        // Grid dots
        ctx.fillStyle = 'rgba(99,102,241,0.04)';
        for (let gx = 0; gx < W; gx += 32) for (let gy = 0; gy < H; gy += 32) { ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill(); }
        // Glow orb
        const orbGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 300);
        orbGrad.addColorStop(0, 'rgba(99,102,241,0.04)'); orbGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = orbGrad; ctx.fillRect(0, 0, W, H);

        ctx.save();
        const slideIn = Math.min(ease * 1.5, 1);
        ctx.globalAlpha = slideIn;
        const sy = (1 - slideIn) * 40;
        ctx.translate(0, sy);

        if (slide.type === 'title') {
          // Icon
          ctx.shadowColor = 'rgba(99,102,241,0.3)'; ctx.shadowBlur = 30;
          ctx.fillStyle = '#6366f1'; ctx.beginPath(); ctx.roundRect(W/2-30, 80, 60, 60, 14); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▶', W/2, 120);
          // Title
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
          wrapText(ctx, slide.heading || '', W/2, 200, W-120, 50);
          // Authors
          if (slide.subheading) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '20px sans-serif'; ctx.fillText(slide.subheading, W/2, 320); }
          // Label
          ctx.fillStyle = 'rgba(99,102,241,0.3)'; ctx.font = '14px monospace'; ctx.fillText('VEDA Research Video', W/2, H-60);
        } else {
          // Section heading with accent bar
          ctx.fillStyle = '#6366f1'; ctx.fillRect(80, 100, 4, 36);
          ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(slide.heading || '', 100, 128);
          // Bullets
          const bullets = slide.bullets || [];
          const startY = 180;
          const lineH = 50;
          const maxVisible = Math.floor(t * bullets.length * 2);
          for (let bi = 0; bi < bullets.length; bi++) {
            if (bi > maxVisible) break;
            const ba = Math.min((t * bullets.length * 2 - bi) * 2, 1);
            ctx.globalAlpha = ba;
            ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(110, startY + bi * lineH, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
            wrapText(ctx, bullets[bi], 130, startY + bi * lineH + 6, W - 200, 24);
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();

        // Progress bar at bottom
        const progress = (si + t) / slides.length;
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, H-4, W, 4);
        const pgGrad = ctx.createLinearGradient(0, 0, W, 0);
        pgGrad.addColorStop(0, 'rgba(99,102,241,0.6)'); pgGrad.addColorStop(1, 'rgba(52,211,153,0.4)');
        ctx.fillStyle = pgGrad; ctx.fillRect(0, H-4, W * progress, 4);

        // Slide indicator
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${si + 1} / ${slides.length}`, W/2, H-16);

        await new Promise(r => requestAnimationFrame(r));
      }
    }
    speechSynthesis.cancel();
    recorder.stop();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) => {
    const words = text.split(' '); let line = '', ly = y;
    for (const w of words) {
      const test = line + (line ? ' ' : '') + w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, ly); line = w; ly += lineH; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, ly);
  };

  const downloadVideo = () => {
    if (!videoPreviewUrl) return;
    const a = document.createElement('a');
    a.href = videoPreviewUrl;
    a.download = `${videoTopic.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}_video.webm`;
    a.click();
  };

  const findMUNDoc = async () => {
    const topic = findTopic.trim();
    if (!topic || findLoading) return;
    const t = await ensureToken();
    if (!t) return;
    setFindLoading(true);
    setFindResult('');
    try {
      const r = await fetch(`${API}/ai/find-mun-doc`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ doc_type: findDocType, topic, country: findCountry.trim() || undefined, api_key: gk }),
      });
      if (!r.ok) { setFindLoading(false); return; }
      const d = await r.json();
      setFindResult(d.result);
    } catch {}
    setFindLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-screen bg-[#07070f] bg-grid bg-stars animate-scaleEntrance">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.015] animate-scanline" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />
      {/* Background Hologram Spinner */}
      <div className="hologram-bg">
        <div className="hologram-core" />
        <div className="hologram-ring hologram-ring-1" />
        <div className="hologram-ring hologram-ring-2" />
        <div className="hologram-ring hologram-ring-3" />
        <div className="hologram-ring hologram-ring-4" />
        <div className="hologram-ring hologram-ring-5" />
        <div className="hologram-dot hologram-dot-1" style={{ top: '50%', left: '50%', marginTop: '-1.5px', marginLeft: '-1.5px' }} />
        <div className="hologram-dot hologram-dot-2" style={{ top: '50%', left: '50%', marginTop: '-1.5px', marginLeft: '-1.5px' }} />
        <div className="hologram-dot hologram-dot-3" style={{ top: '50%', left: '50%', marginTop: '-1.5px', marginLeft: '-1.5px' }} />
      </div>
      {/* Floating background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-rose-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '-6s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-amber-500/2 rounded-full blur-3xl animate-float" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="watermark watermark-glow">VEDA</div>

      {/* Toasts */}
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}

      {/* Initial Loading Skeleton */}
      {initialLoading && !user && !showAuth && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${showSidebar ? 'w-64' : 'w-0 overflow-hidden'} border-r border-white/[0.03] glass-premium bg-[#0a0a14]/60 shrink-0 transition-all duration-300 relative z-10 animate-slideInLeft scrollbar-gradient border-rotate`}>
        <div className="p-3">
          <button onClick={newChat}
            className="flex w-full items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03] hover-lift transition-all ripple-click btn-3d">
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>
        <div className="px-2 pb-1">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/15" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] pl-7 pr-2 text-xs text-white/50 outline-none placeholder:text-white/15 focus:border-white/[0.1] transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="text-[10px] text-white/15 text-center pt-4">No conversations</p>
          ) : filtered.map((c, idx) => (
            <div key={c.id} style={{ animationDelay: `${idx * 40}ms` }}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-all stagger-item conv-glow ${
                c.id === activeId ? 'bg-white/[0.07] text-white shadow-sm sidebar-active' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70'
              }`}
              onClick={() => setActiveId(c.id)}>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate flex-1 text-xs">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/[0.03] space-y-0.5">
          <button onClick={() => router.push('/profile')}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all icon-spin-hover">
            <User className="h-3.5 w-3.5" />
            Profile
          </button>
          <button onClick={() => router.push('/developer')}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all icon-spin-hover">
            <Terminal className="h-3.5 w-3.5" />
            Developer
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => router.push('/admin')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all icon-spin-hover">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </button>
          )}
          <button onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all icon-spin-hover">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <aside className="relative w-72 border-r border-white/[0.06] glass-premium flex flex-col h-full">
            <div className="p-3">
              <button onClick={() => { newChat(); setShowSidebar(false); }}
                className="flex w-full items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03] transition-all">
                <Plus className="h-4 w-4" />
                New chat
              </button>
            </div>
            <div className="px-2 pb-1">
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/15" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] pl-7 pr-2 text-xs text-white/50 outline-none placeholder:text-white/15 focus:border-white/[0.1] transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
              {filtered.length === 0 ? (
                <p className="text-[10px] text-white/15 text-center pt-4">No conversations</p>
              ) : filtered.map(c => (
                <div key={c.id}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-all ${
                    c.id === activeId ? 'bg-white/[0.07] text-white shadow-sm' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70'
                  }`}
                  onClick={() => { setActiveId(c.id); setShowSidebar(false); }}>
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <div className="flex-1 min-w-0">
                {renameId === c.id ? (
                  <input value={renameText} onChange={e => setRenameText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setConversations(prev => prev.map(x => x.id === c.id ? { ...x, title: renameText || x.title } : x)); setRenameId(null); syncConversation({ ...c, title: renameText || c.title }); } if (e.key === 'Escape') setRenameId(null); }}
                    onBlur={() => { setConversations(prev => prev.map(x => x.id === c.id ? { ...x, title: renameText || x.title } : x)); setRenameId(null); syncConversation({ ...c, title: renameText || c.title }); }}
                    className="w-full bg-white/[0.08] text-xs text-white/80 rounded px-1.5 py-0.5 outline-none border border-indigo-500/30" autoFocus
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="truncate block text-xs" onDoubleClick={() => { setRenameId(c.id); setRenameText(c.title); }}>{c.title}</span>
                )}
              </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/[0.03] space-y-0.5">
              <button onClick={() => { router.push('/profile'); setShowSidebar(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all">
                <User className="h-3.5 w-3.5" />
                Profile
              </button>
              <button onClick={() => { router.push('/developer'); setShowSidebar(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all">
                <Terminal className="h-3.5 w-3.5" />
                Developer
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => { router.push('/admin'); setShowSidebar(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all">
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </button>
              )}
              <button onClick={() => { setShowSettings(true); setShowSidebar(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover-lift transition-all">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 border-rotate">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-11 border-b border-white/[0.03] shrink-0 bg-[#07070f]/80 glass-light relative z-10 header-bar">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-white/30 hover:text-white/60 transition-colors shrink-0 hover-lift icon-spin-hover">
              <PanelLeft className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono font-bold bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent neon-text hologram neon-flicker">VEDA</span>
            {active && (
              <span className="text-[11px] text-white/30 truncate ml-1 hidden sm:inline font-mono">/ {active.title}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <button onClick={() => router.push('/profile')}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
                <User className="h-3 w-3" />
                <span className="hidden sm:inline text-[10px] text-emerald-400/70">{user.username}</span>
              </button>
            )}
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
              <Settings className="h-3 w-3" />
            </button>
            {mode === 'mun' && (
              <button onClick={() => setShowFindMun(true)}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
                <Search className="h-3 w-3" />
                <span className="hidden sm:inline">Find</span>
              </button>
            )}
            <button onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
              <FileDown className="h-3 w-3" />
              <span className="hidden sm:inline">Paper</span>
            </button>
            <button onClick={() => setShowVideoGen(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-cyan-400 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
              <Video className="h-3 w-3" />
              <span className="hidden sm:inline">Video</span>
            </button>
            <button onClick={() => setShowPpt(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">PPT</span>
            </button>
            {active && active.messages.length > 0 && (
              <>
                <button onClick={exportDocx}
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
                  <FileText className="h-3 w-3" />
                  <span className="hidden sm:inline">DOCX</span>
                </button>
                <button onClick={exportTxt}
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] hover-lift transition-all">
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">TXT</span>
                </button>
              </>
            )}
            <span className="text-[11px] text-white/20 ml-2 font-mono hidden md:inline">{modes.find(m => m.id === mode)?.label || 'Research'}</span>
            <div className="relative">
              <button onClick={() => setShowProvider(!showProvider)}
                className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 px-1.5 py-0.5 rounded-md hover:bg-white/[0.03] transition-all font-mono ml-1">
                <Cpu className="h-2.5 w-2.5" />
                <span className="uppercase tracking-wider">{provider}</span>
              </button>
              {showProvider && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-white/[0.06] bg-[#0d0d1a] glass shadow-2xl py-1 z-50 animate-scaleIn">
                  {['groq', 'gemini', 'openrouter', 'deepseek'].map(p => (
                    <button key={p} onClick={() => { setProvider(p); setShowProvider(false); localStorage.setItem('veda_provider', p); }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-all ${provider === p ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'}`}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mode Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.03] bg-[#090914]/60 glass-light overflow-x-auto scrollbar-thin shrink-0 relative z-10 mode-shimmer">
          <span className="text-[10px] text-white/15 font-mono mr-1 shrink-0 uppercase tracking-widest">Mode</span>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 hover-lift ${
                mode === m.id
                  ? `bg-gradient-to-r ${m.color} text-white shadow-sm shadow-black/20 glow-${m.color.includes('emerald') ? 'emerald' : m.color.includes('cyan') ? 'cyan' : m.color.includes('amber') ? 'amber' : m.color.includes('rose') ? 'rose' : 'indigo'} mode-active-pulse`
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent card-glow'
              }`}>
              <span className={mode === m.id ? 'text-white' : 'text-white/30'}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-gradient bg-[#07070f] relative z-10">
          <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4">
            {showMsgSearch && messages.length > 0 && (
              <div className="sticky top-0 z-10 pt-2 pb-1">
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                  <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search this conversation..."
                    className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] pl-7 pr-8 text-xs text-white/60 outline-none placeholder:text-white/15 focus:border-indigo-500/30 transition-colors" autoFocus
                    onKeyDown={e => { if (e.key === 'Escape') { setShowMsgSearch(false); setMsgSearch(''); } }} />
                  <button onClick={() => { setShowMsgSearch(false); setMsgSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] text-center px-2">
                <div className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg mb-5 ${
                  modes.find(m => m.id === mode)?.color || 'from-indigo-500 to-cyan-400'
                }`}>
                  {modes.find(m => m.id === mode)?.icon || <Sparkles className="h-7 w-7 md:h-8 md:w-8 text-white" />}
                </div>
                <h1 className="text-xl md:text-2xl font-semibold text-white/85 mb-1.5 bg-gradient-to-r from-white/90 via-cyan-300 to-indigo-300 bg-clip-text text-transparent text-gradient-sweep">{modes.find(m => m.id === mode)?.label || 'How can I help?'}</h1>
                <p className="text-xs md:text-sm text-white/35 mb-6 md:mb-8 max-w-md leading-relaxed">
                  {modes.find(m => m.id === mode)?.desc || 'Research paper writing assistant'}
                </p>
                <div className="grid gap-2 w-full max-w-lg">
                  {(modes.find(m => m.id === mode)?.suggestions || []).map((s, i) => {
                    const variants = [
                      'from-indigo-500/[0.06] to-purple-600/[0.06] border-indigo-500/10',
                      'from-emerald-500/[0.06] to-teal-600/[0.06] border-emerald-500/10',
                      'from-amber-500/[0.06] to-orange-600/[0.06] border-amber-500/10',
                      'from-rose-500/[0.06] to-pink-600/[0.06] border-rose-500/10',
                    ];
                    return (
                      <button key={i} onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                        className={`flex items-center gap-3 rounded-xl border bg-gradient-to-r ${variants[i % 4]} px-4 py-3 text-left text-sm text-white/60 hover:text-white hover:border-white/15 card-glow empty-card transition-all group`}>
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          i % 4 === 0 ? 'bg-indigo-500/15 text-indigo-400' :
                          i % 4 === 1 ? 'bg-emerald-500/15 text-emerald-400' :
                          i % 4 === 2 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          <Search className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-left"><span>{s.text}</span><div className="text-[10px] text-white/20 mt-0.5">{s.sub}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-4 md:py-6 space-y-5 md:space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-messageIn msg-hover`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'w-full md:max-w-[90%] message-ai'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-sm">
                              <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-white/40">VEDA</span>
                            {msg.content && (
                              <span className="text-[9px] text-white/15 font-mono">
                                {msg.content.split(/\s+/).length}w
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {msg.content && (
                              <>
                                <button onClick={() => humanize(i, msg.content)} disabled={humanizing === i}
                                  className="flex items-center gap-1 text-[10px] text-white/20 hover:text-emerald-400 px-1.5 py-0.5 rounded-md hover:bg-white/[0.03] transition-all disabled:opacity-30">
                                  <Feather className="h-3 w-3" />
                                  {humanizing === i ? '...' : 'Humanize'}
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedMsgId(i); setTimeout(() => setCopiedMsgId(null), 1500); }}
                                  className="text-white/20 hover:text-white/60 px-1 py-0.5 rounded-md hover:bg-white/[0.03] transition-all">
                                  {copiedMsgId === i ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                                {mode === 'mun' && (
                                  <button onClick={() => saveSpeech(msg.content, active?.title)}
                                    className="text-white/20 hover:text-emerald-400 px-1 py-0.5 rounded-md hover:bg-white/[0.03] transition-all">
                                    <BookOpen className="h-3 w-3" />
                                  </button>
                                )}
                                <button onClick={() => {
                                  if (speakingIdx === i) { speechSynthesis.cancel(); setSpeakingIdx(null); return; }
                                  setSpeakingIdx(i);
                                  const u = new SpeechSynthesisUtterance(msg.content);
                                  u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1;
                                  u.onend = () => setSpeakingIdx(null);
                                  speechSynthesis.speak(u);
                                }}
                                  className="text-white/20 hover:text-cyan-400 px-1 py-0.5 rounded-md hover:bg-white/[0.03] transition-all">
                                  {speakingIdx === i ? <span className="text-[10px] font-mono text-cyan-400">■</span> : <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {msg.role === 'user' ? (
                        <div className="group relative">
                          {editingIdx === i ? (
                            <div className="flex gap-2">
                              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                                className="flex-1 bg-indigo-500/10 text-white/85 rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm outline-none border border-indigo-500/20 focus:border-indigo-500/40 resize-none"
                                rows={Math.min(editText.split('\n').length, 6)} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(i); } if (e.key === 'Escape') cancelEdit(); }} />
                              <div className="flex flex-col gap-1">
                                <button onClick={() => saveEdit(i)} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                                  <Save className="h-3 w-3" />
                                </button>
                                <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/70 transition-all">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="inline-block message-user-bubble text-white/85 rounded-2xl rounded-br-md px-3.5 md:px-4 py-2 md:py-2.5 text-sm leading-relaxed">
                                {msg.content}
                              </div>
                              <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(i, msg.content)}
                                  className="p-1 rounded-md bg-[#1a1a2e] border border-white/[0.06] text-white/30 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-lg">
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button onClick={() => deleteMessage(i)}
                                  className="p-1 rounded-md bg-[#1a1a2e] border border-white/[0.06] text-white/30 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-white/70 [&_a]:text-cyan-400 [&_a:hover]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-white/10 [&_strong]:text-white/85 [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:p-0 gradient-reveal msg-reveal">
                          {msg.content ? md(msg.content) : (
                            streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1.5">
                      <span className="h-2 w-2 rounded-full morph-dot" style={{ animationDelay: '0ms', background: 'linear-gradient(135deg, #818cf8, #34d399)' }} />
                      <span className="h-2 w-2 rounded-full morph-dot" style={{ animationDelay: '200ms', background: 'linear-gradient(135deg, #34d399, #22d3ee)' }} />
                      <span className="h-2 w-2 rounded-full morph-dot" style={{ animationDelay: '400ms', background: 'linear-gradient(135deg, #22d3ee, #818cf8)' }} />
                    </span>
                            ) : ''
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="border-t border-white/[0.02] bg-[#07070f] shrink-0 relative z-10">
          <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 pt-2 pb-1">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
              {(mode === 'research' ? [
                { icon: <AlignLeft className="h-3 w-3" />, label: 'Outline', prompt: 'Help me outline a research paper on' },
                { icon: <FileText className="h-3 w-3" />, label: 'Abstract', prompt: 'Write an abstract for a paper about' },
                { icon: <Search className="h-3 w-3" />, label: 'Find Papers', prompt: 'Find recent papers about' },
                { icon: <Quote className="h-3 w-3" />, label: 'Cite', prompt: 'Generate citations in APA format for the topic:' },
                { icon: <Lightbulb className="h-3 w-3" />, label: 'RQ Check', prompt: 'Evaluate this research question for feasibility, novelty, and significance:' },
                { icon: <BookOpen className="h-3 w-3" />, label: 'Lit Matrix', prompt: 'Create a literature review matrix comparing key papers on ' },
                { icon: <ListChecks className="h-3 w-3" />, label: 'Method', prompt: 'What research methodology should I use for studying ' },
                { icon: <FileDown className="h-3 w-3" />, label: 'Grant', prompt: 'Outline a grant proposal for researching ' },
                { icon: <ScrollText className="h-3 w-3" />, label: 'Timeline', prompt: 'Create a 6-month research timeline for a project on ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, label: 'Conference', prompt: 'Find major conferences accepting papers on ' },
              ] : mode === 'mun' ? [
                { icon: <Globe className="h-3 w-3" />, label: 'Position Paper', prompt: 'Write a position paper for ' },
                { icon: <ScrollText className="h-3 w-3" />, label: 'Resolution', prompt: 'Draft a UN resolution on ' },
                { icon: <PenLine className="h-3 w-3" />, label: 'Speech', prompt: 'Write a 1-minute opening speech for the delegate of ' },
                { icon: <Library className="h-3 w-3" />, label: 'Country Brief', prompt: 'Summarize the stance, allies, and voting history of ' },
                { icon: <Quote className="h-3 w-3" />, label: 'Official Speech', prompt: 'Write a speech for the UN Secretary-General on ' },
                { icon: <FileText className="h-3 w-3" />, label: 'Working Paper', prompt: 'Draft a working paper for committee discussion on ' },
                { icon: <Search className="h-3 w-3" />, label: 'Deep Research', prompt: 'Conduct deep research on ' },
                { icon: <ListChecks className="h-3 w-3" />, label: 'Stance', prompt: 'Analyze the stance of all major powers on ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'Caucus', prompt: 'Draft a moderated caucus speech of 60 seconds for ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, label: 'Blocs', prompt: 'Analyze the voting blocs and alliances on the issue of ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, label: 'Crisis Note', prompt: 'Draft a crisis committee note from the delegate of ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>, label: 'Treaty', prompt: 'Find relevant treaties and conventions related to ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'Strategy', prompt: 'Develop a negotiation strategy for the delegate of ' },
                { icon: <BookOpen className="h-3 w-3" />, label: 'Past Speeches', prompt: '' },
              ] : mode === 'literature' ? [
                { icon: <BookOpen className="h-3 w-3" />, label: 'Summarize', prompt: 'Summarize the key papers on ' },
                { icon: <ListChecks className="h-3 w-3" />, label: 'Compare', prompt: 'Compare and contrast different approaches to ' },
                { icon: <Search className="h-3 w-3" />, label: 'Find Gaps', prompt: 'What are the research gaps in ' },
                { icon: <Quote className="h-3 w-3" />, label: 'BibTeX', prompt: 'Generate BibTeX references for papers about ' },
              ] : mode === 'brainstorm' ? [
                { icon: <Lightbulb className="h-3 w-3" />, label: 'Ideas', prompt: 'Generate novel research ideas for ' },
                { icon: <Search className="h-3 w-3" />, label: 'What If', prompt: 'What if we combine ' },
                { icon: <BookOpen className="h-3 w-3" />, label: 'Methodology', prompt: 'Suggest innovative methodologies for studying ' },
                { icon: <FileText className="h-3 w-3" />, label: 'Grant Idea', prompt: 'Suggest a grant-worthy research direction for ' },
              ] : mode === 'editor' ? [
                { icon: <PenLine className="h-3 w-3" />, label: 'Improve', prompt: 'Improve the clarity of this text:\n\n' },
                { icon: <Languages className="h-3 w-3" />, label: 'Paraphrase', prompt: 'Paraphrase this to be more concise:\n\n' },
                { icon: <Check className="h-3 w-3" />, label: 'Proofread', prompt: 'Proofread this for grammar and style:\n\n' },
                { icon: <AlignLeft className="h-3 w-3" />, label: 'Condense', prompt: 'Condense this to half the length:\n\n' },
              ] : mode === 'experiment' ? [
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>, label: 'Design', prompt: 'Design an experiment to test ' },
                { icon: <Search className="h-3 w-3" />, label: 'Simulate', prompt: 'Simulate possible outcomes for ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: 'Variables', prompt: 'What variables should I consider for ' },
                { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Validity', prompt: 'What are the threats to validity for ' },
              ] : [
                { icon: <ScrollText className="h-3 w-3" />, label: 'Review', prompt: 'Provide a peer review of the following:\n\n' },
                { icon: <Search className="h-3 w-3" />, label: 'Check Methods', prompt: 'Critique the methodology described here:\n\n' },
                { icon: <BookOpen className="h-3 w-3" />, label: 'Check Citations', prompt: 'Are the citations in this section appropriate?\n\n' },
                { icon: <ListChecks className="h-3 w-3" />, label: 'Full Review', prompt: 'Give me a comprehensive peer review:\n\n' },
              ]).map((tool, i) => (
                <button key={i} onClick={() => { if (tool.label === 'Past Speeches') { setShowPastSpeeches(true); } else { setInput(tool.prompt); inputRef.current?.focus(); } }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors shrink-0 whitespace-nowrap tool-btn border border-transparent">
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.02] bg-[#07070f] shrink-0 relative z-10 animate-slideUp">
          <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 py-2 md:py-3">
            <div className={`flex items-end gap-2 rounded-xl md:rounded-2xl border border-white/[0.06] bg-white/[0.03] px-2 md:px-3 py-2 md:py-3 focus-within:border-indigo-500/30 focus-within:bg-white/[0.05] input-glow input-pulse-glow transition-all shadow-sm shadow-black/10 ${input.trim() ? 'active-content' : ''}`}>
              <label className="shrink-0 cursor-pointer text-white/20 hover:text-white/50 transition-colors p-1">
                <input type="file" accept=".txt,.md,.csv,.json,.bib" onChange={handleFileUpload} className="hidden" disabled={streaming || fileUploading} />
                {fileUploading ? <span className="h-4 w-4 border border-white/30 border-t-transparent rounded-full animate-spin block" /> : <Upload className="h-4 w-4" />}
              </label>
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={modes.find(m => m.id === mode)?.placeholder || 'Ask about your research paper...'}
                className="flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/15 resize-none py-0.5 max-h-32"
                disabled={streaming}
                rows={1}
              />
              {streaming ? (
                <button onClick={() => { abortRef.current?.abort(); setStreaming(false); }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/50 hover:bg-white/20 hover:text-white recording-pulse transition-all">
                  <span className="text-[10px] font-medium">■</span>
                </button>
              ) : (
                <button onClick={handleSend} disabled={!input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 neon-glow-intense ripple lightning-hover ripple-click btn-3d">
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMsgSearch(!showMsgSearch)}
                  className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all ${showMsgSearch ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/15 hover:text-white/30'}`}>
                  <Search className="h-2.5 w-2.5" />
                  Find
                </button>
                <button onClick={() => { setShowPrompts(true); }}
                  className="flex items-center gap-1 text-[9px] font-mono text-white/15 hover:text-white/30 px-1.5 py-0.5 rounded-md hover:bg-white/[0.03] transition-all">
                  <BookOpen className="h-2.5 w-2.5" />
                  Prompts
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/12 font-mono">
                  {input.length > 0 ? `${input.length}c · ${Math.ceil(input.length / 4)}t` : ''}
                </span>
                <button onClick={() => setAutoScroll(!autoScroll)}
                  className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all ${autoScroll ? 'text-white/15 hover:text-white/30' : 'text-amber-400 bg-amber-500/10'}`}>
                  <ScrollText className="h-2.5 w-2.5" />
                  {autoScroll ? 'Auto' : 'Paused'}
                </button>
                <span className="text-[9px] text-white/15 font-mono tracking-wider">VEDA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Footer - compact */}
        <footer className="border-t border-white/[0.02] bg-[#07070f] shrink-0">
          <div className="mx-auto w-full md:max-w-3xl px-3 py-1.5 flex items-center justify-center gap-2">
            <span className="text-[9px] font-semibold bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent tracking-wider">
              PURVESH NILESH BHADALE
            </span>
            <span className="text-[7px] text-white/10">&middot;</span>
            <span className="text-[8px] text-white/15">&copy; {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>

      {/* Generate Paper Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => { if (!generating) { setShowGenerate(false); setGenerateTopic(''); } }} />
          <div className="relative w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 neon-glow animate-springIn">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                  <FileDown className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Generate Paper</h2>
              </div>
              <button onClick={() => { if (!generating) { setShowGenerate(false); setGenerateTopic(''); } }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-white/30 mb-3">Enter a topic to generate a complete research paper with real arXiv references as DOCX.</p>
            <input value={generateTopic} onChange={(e) => setGenerateTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') generatePaper(); }}
              placeholder="e.g. Quantum machine learning for drug discovery"
              className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/15 mb-3"
              disabled={generating} autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowGenerate(false); setGenerateTopic(''); }}
                className="text-xs px-4 py-2 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors">Cancel</button>
              <button onClick={generatePaper} disabled={!generateTopic.trim() || generating}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {generating ? <><span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Generating...</> : <><FileDown className="h-3 w-3" /> Generate Paper</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Library Modal */}
      {showPrompts && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => { setShowPrompts(false); setPromptName(''); setPromptText(''); }} />
          <div className="relative w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 max-h-[80vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Prompt Library</h2>
              </div>
              <button onClick={() => { setShowPrompts(false); setPromptName(''); setPromptText(''); }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {prompts.length === 0 && <p className="text-xs text-white/20 text-center py-4">No saved prompts yet</p>}
              {prompts.map((p, i) => (
                <div key={i} className="group flex items-center gap-2 glass-light rounded-xl border border-white/[0.04] px-3 py-2">
                  <button onClick={() => { setInput(p.text); setShowPrompts(false); addToast('Prompt loaded', 'success'); }}
                    className="flex-1 text-left">
                    <div className="text-xs font-medium text-white/70">{p.name}</div>
                    <div className="text-[10px] text-white/30 truncate">{p.text.slice(0, 80)}</div>
                  </button>
                  <button onClick={() => {
                    const updated = prompts.filter((_, j) => j !== i);
                    setPrompts(updated);
                    localStorage.setItem('veda_prompts', JSON.stringify(updated));
                    addToast('Prompt deleted', 'info');
                  }} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.04] pt-3">
              <input value={promptName} onChange={e => setPromptName(e.target.value)} placeholder="Prompt name..."
                className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 text-xs text-white/60 outline-none placeholder:text-white/15 focus:border-indigo-500/30 mb-2" />
              <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Prompt text..."
                className="w-full h-20 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-white/60 outline-none placeholder:text-white/15 focus:border-indigo-500/30 resize-none mb-2" />
              <button onClick={() => {
                if (!promptName.trim() || !promptText.trim()) return;
                const updated = [...prompts, { name: promptName.trim(), text: promptText.trim() }];
                setPrompts(updated);
                localStorage.setItem('veda_prompts', JSON.stringify(updated));
                setPromptName(''); setPromptText('');
                addToast('Prompt saved', 'success');
              }} disabled={!promptName.trim() || !promptText.trim()}
                className="w-full h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-xs font-medium hover:opacity-90 disabled:opacity-20 transition-all">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find MUN Documents Modal */}
      {showFindMun && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => { if (!findLoading) { setShowFindMun(false); setFindResult(''); } }} />
          <div className="relative w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 max-h-[85vh] flex flex-col neon-glow">
            <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Search className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Find MUN Documents</h2>
              </div>
              <button onClick={() => { if (!findLoading) { setShowFindMun(false); setFindResult(''); } }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 mb-3 shrink-0">
              <div className="flex gap-2">
                <select value={findDocType} onChange={(e) => setFindDocType(e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-emerald-500/30 transition-colors">
                  <option value="stance">Stance Analysis</option>
                  <option value="speech">Speeches of Officials</option>
                  <option value="resolution">Draft Resolutions</option>
                  <option value="working_paper">Working Papers</option>
                  <option value="position_paper">Position Papers</option>
                  <option value="deep_research">Deep Research</option>
                </select>
                <input value={findCountry} onChange={(e) => setFindCountry(e.target.value)}
                  placeholder="Country"
                  className="flex-1 h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/15" />
              </div>
              <div className="flex gap-2">
                <input value={findTopic} onChange={(e) => setFindTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') findMUNDoc(); }}
                  placeholder="e.g. Arctic sovereignty, AI regulation..."
                  className="flex-1 h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/15"
                  disabled={findLoading} autoFocus />
                <button onClick={findMUNDoc} disabled={!findTopic.trim() || findLoading}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                  {findLoading ? <span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <><Search className="h-3 w-3" /> Find</>}
                </button>
              </div>
            </div>
            {findResult && (
              <div className="flex-1 overflow-y-auto scrollbar-thin border border-white/[0.04] rounded-xl bg-white/[0.02] p-4">
                <div className="text-xs md:text-sm leading-relaxed text-white/70 whitespace-pre-wrap [&_strong]:text-white/85">
                  {findResult}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(findResult); }}
                  className="mt-3 flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PPT Generator Modal */}
      {showPpt && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => { if (!pptGenerating) setShowPpt(false); }} />
          <div className="relative w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 neon-glow animate-scaleIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
                  <FileText className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">PPT Generator</h2>
              </div>
              <button onClick={() => { if (!pptGenerating) setShowPpt(false); }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setPptType('research')}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${pptType === 'research' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'}`}>
                  Research
                </button>
                <button onClick={() => setPptType('mun')}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${pptType === 'mun' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'}`}>
                  MUN
                </button>
              </div>
              <div>
                <label className="text-[10px] text-white/30 font-mono mb-1 block">Title *</label>
                <input value={pptTitle} onChange={e => setPptTitle(e.target.value)}
                  placeholder={pptType === 'mun' ? "e.g. UNSC: Reform of the Security Council" : "e.g. Quantum Machine Learning for Drug Discovery"}
                  className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 font-mono mb-1 block">{pptType === 'mun' ? 'Country — Delegate Name' : 'Authors'}</label>
                <input value={pptAuthors} onChange={e => setPptAuthors(e.target.value)}
                  placeholder={pptType === 'mun' ? "e.g. France — John Smith" : "e.g. Smith, J., Patel, R."}
                  className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 font-mono mb-1 block">Topic / Committee</label>
                <input value={pptTopic} onChange={e => setPptTopic(e.target.value)}
                  placeholder={pptType === 'mun' ? "e.g. UN Security Council" : "e.g. Computational Biology"}
                  className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 font-mono mb-1 block">Key Points</label>
                <textarea value={pptKeyPoints} onChange={e => setPptKeyPoints(e.target.value)}
                  placeholder="Main arguments, findings, or policy positions..."
                  className="w-full h-20 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15 resize-none" />
              </div>
              <button onClick={generatePpt} disabled={!pptTitle.trim() || pptGenerating}
                className="w-full h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-xs font-medium hover:opacity-90 disabled:opacity-20 transition-all flex items-center justify-center gap-2">
                {pptGenerating ? <><span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><FileText className="h-3.5 w-3.5" /> Generate PPT</>}
              </button>
              <p className="text-[9px] text-white/12 text-center font-mono">AI generates 6-10 styled slides with gradients, bullets, and quotes</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Generator Modal */}
      {showVideoGen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => { if (!videoRecording) { setShowVideoGen(false); setVideoScript(null); setVideoPreviewUrl(null); } }} />
          <div className="relative w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 max-h-[85vh] flex flex-col neon-glow animate-scaleIn">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20">
                  <Video className="h-4 w-4 text-cyan-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Research Video Generator</h2>
              </div>
              <button onClick={() => { if (!videoRecording) { setShowVideoGen(false); setVideoScript(null); setVideoPreviewUrl(null); } }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {!videoScript ? (
              <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1 pr-1">
                <div className="flex items-center gap-3 mb-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 shrink-0">
                    <Video className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">Enter a research topic and VEDA will generate a complete animated video with AI narration.</p>
                </div>
                <div>
                  <label className="text-[10px] text-white/30 font-mono mb-1 block">Research Topic *</label>
                  <textarea value={videoTopic} onChange={e => setVideoTopic(e.target.value)} placeholder="e.g. Quantum Machine Learning for Drug Discovery, or Climate Change Adaptation in Coastal Cities"
                    className="w-full h-24 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/70 outline-none focus:border-cyan-500/30 transition-colors placeholder:text-white/15 resize-none" />
                </div>
                <button onClick={generateVideoScript} disabled={!videoTopic.trim() || videoGenerating}
                  className="w-full h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-medium hover:opacity-90 disabled:opacity-20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                  {videoGenerating ? <><span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Video className="h-3.5 w-3.5" /> Generate Video</>}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="text-[10px] text-white/20 font-mono mb-2">AI Video Preview — rendering in real-time</div>
                <div className="relative flex-1 rounded-xl border border-white/[0.06] bg-[#0a0a14] overflow-hidden mb-3 min-h-[200px] flex items-center justify-center">
                  {videoRecording ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                      </div>
                      <span className="text-[10px] text-white/30 font-mono">Rendering video with AI narration...</span>
                    </div>
                  ) : videoPreviewUrl ? (
                    <video src={videoPreviewUrl} controls className="w-full h-full rounded-lg" />
                  ) : (
                    <div className="text-center p-6">
                      <Video className="h-10 w-10 text-cyan-400/30 mx-auto mb-2" />
                      <p className="text-xs text-white/30">Click Generate Video to create your AI research video</p>
                    </div>
                  )}
                  <canvas ref={videoCanvasRef} className="hidden" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={generateVideo} disabled={videoRecording || !videoScript}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-lg shadow-cyan-500/20">
                    {videoRecording ? <><span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rendering...</> : <><Video className="h-3 w-3" /> Generate Video</>}
                  </button>
                  {videoPreviewUrl && (
                    <button onClick={downloadVideo}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                      <Download className="h-3 w-3" /> Download .webm
                    </button>
                  )}
                  <button onClick={() => { setVideoScript(null); setVideoPreviewUrl(null); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-white/60 transition-all ml-auto">
                    Edit Content
                  </button>
                </div>
                {videoPreviewUrl && (
                  <div className="mt-2 text-[9px] text-white/15 font-mono text-center">
                    Video rendered with AI narration via SpeechSynthesis
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal - blocking full screen */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] glass-premium shadow-2xl mx-4 p-6 animate-scaleIn breathe-border">
            <div className="flex items-center justify-center mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-center text-white/80 mb-1">
              {authIsLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-xs text-center text-white/30 mb-5">
              {authIsLogin ? 'Sign in to access your profile' : 'Register with your details'}
            </p>
            <form onSubmit={handleAuth} className="space-y-3">
              {!authIsLogin && (
                <>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Full Name</label>
                    <input name="full_name" type="text" placeholder="Dr. Jane Smith"
                      className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Email</label>
                    <input name="email" type="email" placeholder="jane@university.edu"
                      className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Username</label>
                <input name="username" type="text" placeholder="Enter username"
                  className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15"
                  autoFocus autoComplete="username" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Password</label>
                <input name="password" type="password" placeholder="Enter password"
                  className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15"
                  autoComplete={authIsLogin ? 'current-password' : 'new-password'} />
              </div>
              {authError && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{authError}</p>
              )}
              <button type="submit" disabled={authLoading}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                {authLoading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : authIsLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => { setAuthIsLogin(!authIsLogin); setAuthError(''); }}
                className="text-xs text-white/30 hover:text-cyan-400 transition-colors">
                {authIsLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => setShowSettings(false)} />
          <div className="relative w-full md:max-w-sm rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl md:mx-4 neon-glow animate-scaleIn">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
                  <Settings className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 md:px-5 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-white/50">Temperature</label>
                  <span className="text-xs text-white/30 font-mono">{temperature.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.06] accent-indigo-500" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-4 md:px-5 py-3 border-t border-white/[0.04]">
              <button onClick={() => setShowSettings(false)}
                className="text-xs px-4 py-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Speeches Modal */}
      {showPastSpeeches && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 modal-backdrop" onClick={() => setShowPastSpeeches(false)} />
          <div className="relative w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl border border-white/[0.08] glass-premium shadow-2xl p-4 md:p-5 md:mx-4 max-h-[85vh] flex flex-col neon-glow">
            <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-medium text-white/70">Past Speeches Library</h2>
                <span className="text-[10px] text-white/20 font-mono px-2 py-0.5 rounded-full bg-white/[0.04]">{savedSpeeches.length}</span>
              </div>
              <button onClick={() => setShowPastSpeeches(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 shrink-0">
              <input value={speechSearch} onChange={e => setSpeechSearch(e.target.value)}
                placeholder="Search speeches by topic or content..."
                className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/15" autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
              {savedSpeeches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <BookOpen className="h-5 w-5 text-white/20" />
                    </div>
                  </div>
                  <p className="text-sm text-white/30">No saved speeches yet</p>
                  <p className="text-[11px] text-white/15 mt-1">Click the <BookOpen className="h-3 w-3 inline -mt-0.5" /> icon on AI messages in MUN mode to save speeches</p>
                </div>
              ) : (
                savedSpeeches.filter(s => !speechSearch || s.topic.toLowerCase().includes(speechSearch.toLowerCase()) || s.content.toLowerCase().includes(speechSearch.toLowerCase())).map((speech) => (
                  <div key={speech.id} className="group rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all cursor-pointer"
                    onClick={() => { setInput(speech.content); inputRef.current?.focus(); setShowPastSpeeches(false); }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-white/70 truncate">{speech.topic}</span>
                          <span className="text-[9px] text-white/20 font-mono shrink-0 bg-white/[0.04] px-1.5 py-0.5 rounded">{speech.date}</span>
                        </div>
                        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">{speech.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(speech.content); addToast('Copied to clipboard', 'success'); }}
                          className="p-1.5 rounded-md bg-white/[0.04] text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSavedSpeeches(prev => { const updated = prev.filter(s => s.id !== speech.id); try { localStorage.setItem('veda_speeches', JSON.stringify(updated)); } catch {} return updated; }); addToast('Speech deleted', 'info'); }}
                          className="p-1.5 rounded-md bg-white/[0.04] text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {savedSpeeches.length > 0 && (
              <div className="flex justify-end pt-3 border-t border-white/[0.04] mt-3 shrink-0">
                <button onClick={() => { setSavedSpeeches([]); try { localStorage.setItem('veda_speeches', '[]'); } catch {} addToast('All speeches cleared', 'info'); }}
                  className="text-[10px] px-3 py-1.5 rounded-lg border border-white/[0.06] text-white/20 hover:text-red-400 hover:border-red-500/20 transition-colors">Clear All</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
