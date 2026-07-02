'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Send, Sparkles, Plus, Search, Settings, Key, Eye, EyeOff, X, MessageSquare, Trash2, PanelLeft, FileText, Feather, Copy, Check, ExternalLink, FileDown, BookOpen, Globe, Library, Lightbulb, PenLine, ScrollText, Quote, Download, AlignLeft, Languages, ListChecks } from 'lucide-react';

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

const providers = [
  { id: 'gemini', label: 'Gemini', url: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq', label: 'Groq', url: 'https://console.groq.com/keys' },
  { id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/keys' },
  { id: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
];

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
    ]},
  { id: 'mun', label: 'MUN', icon: <Globe className="h-3.5 w-3.5" />, desc: 'Model UN preparation', placeholder: 'Ask about MUN position papers, speeches...', color: 'from-emerald-500 to-teal-400', btnColor: 'border-emerald-500/10 hover:border-emerald-500/30',
    suggestions: [
      { text: 'Write a position paper for France on AI regulation', sub: 'Position paper' },
      { text: 'Draft a resolution on climate financing for developing nations', sub: 'Resolution drafting' },
      { text: 'Write a 1-minute opening speech for India on cybersecurity', sub: 'Opening speech' },
      { text: 'Summarize China stance on South China Sea for UNSC', sub: 'Country research' },
    ]},
  { id: 'literature', label: 'Lit Review', icon: <Library className="h-3.5 w-3.5" />, desc: 'Find & synthesize papers', placeholder: 'Search papers, synthesize findings...', color: 'from-violet-500 to-purple-400', btnColor: 'border-violet-500/10 hover:border-violet-500/30',
    suggestions: [
      { text: 'Summarize recent advances in quantum machine learning', sub: 'Literature synthesis' },
      { text: 'Find research gaps in federated learning for healthcare', sub: 'Gap analysis' },
      { text: 'Compare transformer vs CNN approaches in medical imaging', sub: 'Paper comparison' },
      { text: 'Generate a BibTeX bibliography on reinforcement learning', sub: 'Citation export' },
    ]},
  { id: 'brainstorm', label: 'Ideas', icon: <Lightbulb className="h-3.5 w-3.5" />, desc: 'Generate & refine ideas', placeholder: 'Brainstorm research ideas...', color: 'from-amber-500 to-orange-400', btnColor: 'border-amber-500/10 hover:border-amber-500/30',
    suggestions: [
      { text: 'What are some novel research questions in computational biology?', sub: 'Idea generation' },
      { text: 'How can blockchain technology be applied to academic publishing?', sub: 'Cross-disciplinary' },
      { text: 'What if we combined GANs with reinforcement learning for drug discovery?', sub: 'Provocative question' },
      { text: 'Suggest innovative methodologies for studying social media polarization', sub: 'Methodology design' },
    ]},
  { id: 'editor', label: 'Editor', icon: <PenLine className="h-3.5 w-3.5" />, desc: 'Polish academic writing', placeholder: 'Paste text to edit or polish...', color: 'from-rose-500 to-pink-400', btnColor: 'border-rose-500/10 hover:border-rose-500/30',
    suggestions: [
      { text: 'Improve the clarity of this paragraph about statistical methods', sub: 'Clarity polish' },
      { text: 'Make this abstract more concise and impactful', sub: 'Conciseness' },
      { text: 'Check this methodology section for logical gaps', sub: 'Argument check' },
      { text: 'Format these citations in APA style', sub: 'Citation formatting' },
    ]},
  { id: 'review', label: 'Review', icon: <ScrollText className="h-3.5 w-3.5" />, desc: 'Peer review simulator', placeholder: 'Paste a draft to get peer review...', color: 'from-cyan-500 to-blue-400', btnColor: 'border-cyan-500/10 hover:border-cyan-500/30',
    suggestions: [
      { text: 'Review this introduction for clarity and positioning', sub: 'Introduction review' },
      { text: 'Critique my methodology — are there validity threats?', sub: 'Methods critique' },
      { text: 'Assess the contribution and novelty of this work', sub: 'Contribution assessment' },
      { text: 'Give me a full peer review of this discussion section', sub: 'Full review' },
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
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-white/20 inline-flex items-center gap-1">
          {linkMatch[1]}<ExternalLink className="h-3 w-3 inline" />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    const bareUrlMatch = remaining.match(/^(https?:\/\/[^\s<]+)/);
    if (bareUrlMatch) {
      const url = bareUrlMatch[1];
      parts.push(
        <a key={key++} href={url} target="_blank" rel="noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-white/20 inline-flex items-center gap-0.5">
          {url.slice(0, 50)}{url.length > 50 ? '…' : ''}<ExternalLink className="h-3 w-3 inline shrink-0" />
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

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState('');
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [humanizing, setHumanizing] = useState<number | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState('research');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find(c => c.id === activeId);
  const messages = active?.messages || [];
  const hasAnyKey = Object.values(configured).some(Boolean);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (!streaming) inputRef.current?.focus(); }, [streaming]);
  useEffect(() => { fetchKeyStatus(); }, []);

  const ensureToken = async () => {
    let t = localStorage.getItem('access_token');
    if (t) return t;
    try {
      const r = await fetch(`${API}/auth/auto-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (r.ok) { const d = await r.json(); localStorage.setItem('access_token', d.access_token); return d.access_token; }
    } catch {}
    return null;
  };

  const token = () => localStorage.getItem('access_token');

  const fetchKeyStatus = async () => {
    const t = await ensureToken();
    if (!t) return;
    try {
      const r = await fetch(`${API}/auth/keys`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (r.ok) setConfigured((await r.json()).configured || {});
    } catch {}
  };

  const saveKeys = async () => {
    const t = await ensureToken();
    if (!t) { setKeyStatus('Auth failed'); return; }
    try {
      const r = await fetch(`${API}/auth/keys`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` }, body: JSON.stringify(apiKeys) });
      if (r.ok) { setKeyStatus('Saved'); fetchKeyStatus(); setTimeout(() => setKeyStatus(''), 2000); }
      else { setKeyStatus('Failed'); }
    } catch { setKeyStatus('Error'); }
  };

  const newChat = () => {
    const id = Date.now().toString();
    setConversations(prev => [...prev, { id, title: 'New chat', messages: [] }]);
    setActiveId(id);
    setInput('');
  };

  const deleteChat = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId('');
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    let convId = activeId;
    if (!convId) {
      convId = Date.now().toString();
      setConversations(prev => [...prev, { id: convId, title: text.slice(0, 40), messages: [] }]);
      setActiveId(convId);
    } else {
      setConversations(prev => prev.map(c => c.id === convId && c.title === 'New chat' ? { ...c, title: text.slice(0, 40) } : c));
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
        body: JSON.stringify({ messages: currentMsgs, mode }), signal: controller.signal,
      });
      if (!res.ok) throw new Error('Stream failed');
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
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c;
          const msgs = [...c.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && !last.content) msgs[msgs.length - 1] = { ...last, content: 'Error. Check your API key in settings.' };
          return { ...c, messages: msgs };
        }));
      }
    } finally { setStreaming(false); abortRef.current = null; }
  }, [input, streaming, activeId, conversations]);

  const exportDocx = async () => {
    const t = await ensureToken();
    if (!t || !active) return;
    try {
      const r = await fetch(`${API}/ai/export/docx`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ messages: active.messages }),
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
        body: JSON.stringify({ text }),
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

  const generatePaper = async () => {
    const topic = generateTopic.trim();
    if (!topic || generating) return;
    const t = await ensureToken();
    if (!t) return;
    setGenerating(true);
    try {
      const r = await fetch(`${API}/ai/generate-paper`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ topic }),
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-screen bg-[#0d0d1a]">
      {/* Sidebar */}
      <aside className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden border-r border-white/[0.03] flex flex-col bg-[#090912] shrink-0`}>
        <div className="p-3">
          <button onClick={newChat}
            className="flex w-full items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03] transition-all">
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {conversations.map(c => (
            <div key={c.id}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors ${
                c.id === activeId ? 'bg-white/[0.07] text-white' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70'
              }`}
              onClick={() => setActiveId(c.id)}>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/[0.03]">
          <button onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-11 border-b border-white/[0.03] shrink-0 bg-[#0d0d1a]">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-white/30 hover:text-white/60 transition-colors">
              <PanelLeft className="h-4 w-4" />
            </button>
            {!hasAnyKey && (
              <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 text-[11px] text-amber-400/60 hover:text-amber-400 bg-amber-400/[0.04] px-2 py-1 rounded-lg transition-colors">
                <Key className="h-3 w-3" />
                Add API key
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors">
              <FileDown className="h-3 w-3" />
              Generate
            </button>
            {active && active.messages.length > 0 && (
              <button onClick={exportDocx}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors">
                <FileText className="h-3 w-3" />
                DOCX
              </button>
            )}
            <span className="text-[11px] text-white/20 ml-2 font-mono">VEDA</span>
          </div>
        </header>

        {/* Mode Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.03] bg-[#0a0a16] overflow-x-auto scrollbar-thin shrink-0">
          <span className="text-[10px] text-white/20 font-mono mr-1 shrink-0 uppercase tracking-wider">Mode</span>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                mode === m.id
                  ? `bg-gradient-to-r ${m.color} text-white shadow-sm`
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
              }`}>
              <span className={mode === m.id ? 'text-white' : 'text-white/30'}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg mb-5 ${
                  modes.find(m => m.id === mode)?.color || 'from-indigo-500 to-cyan-400'
                } ${mode === 'research' ? 'shadow-indigo-500/15' : mode === 'mun' ? 'shadow-emerald-500/15' : mode === 'literature' ? 'shadow-violet-500/15' : mode === 'brainstorm' ? 'shadow-amber-500/15' : mode === 'editor' ? 'shadow-rose-500/15' : 'shadow-cyan-500/15'}`}>
                  {modes.find(m => m.id === mode)?.icon || <Sparkles className="h-7 w-7 text-white" />}
                </div>
                <h1 className="text-xl font-semibold text-white/85 mb-1.5">{modes.find(m => m.id === mode)?.label || 'How can I help?'}</h1>
                <p className="text-sm text-white/35 mb-7 max-w-md leading-relaxed">
                  {modes.find(m => m.id === mode)?.desc || 'Research paper writing assistant'}
                </p>
                <div className="grid gap-2 w-full max-w-lg">
                  {(modes.find(m => m.id === mode)?.suggestions || []).map((s, i) => {
                    const colors = [
                      'from-indigo-500/[0.08] to-purple-500/[0.08]', 'from-emerald-500/[0.08] to-teal-500/[0.08]',
                      'from-amber-500/[0.08] to-orange-500/[0.08]', 'from-rose-500/[0.08] to-pink-500/[0.08]',
                    ];
                    const borders = [
                      'border-indigo-500/10', 'border-emerald-500/10', 'border-amber-500/10', 'border-rose-500/10',
                    ];
                    return (
                      <button key={i} onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                        className={`flex items-center gap-3 rounded-xl border ${borders[i % 4]} ${colors[i % 4]} px-4 py-3 text-left text-sm text-white/60 hover:text-white hover:border-white/15 transition-all group`}>
                        <Search className="h-4 w-4 text-white/20 group-hover:text-white/50 shrink-0" />
                        <div className="text-left"><span>{s.text}</span><div className="text-[10px] text-white/20 mt-0.5">{s.sub}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.role === 'user' ? 'max-w-[75%]' : 'max-w-[85%] w-full'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400">
                              <Sparkles className="h-2.5 w-2.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-white/30">Assistant</span>
                          </div>
                          {msg.content && (
                            <button onClick={() => humanize(i, msg.content)} disabled={humanizing === i}
                              className="flex items-center gap-1 text-[10px] text-white/20 hover:text-emerald-400 px-1.5 py-0.5 rounded-md hover:bg-white/[0.03] transition-all disabled:opacity-30">
                              <Feather className="h-3 w-3" />
                              {humanizing === i ? '...' : 'Humanize'}
                            </button>
                          )}
                        </div>
                      )}
                      {msg.role === 'user' ? (
                        <div className="inline-block bg-indigo-500/10 text-white/85 rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-white/70 [&_a]:text-cyan-400 [&_a:hover]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-white/10 [&_strong]:text-white/85 [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:p-0">
                          {msg.content ? md(msg.content) : (
                            streaming && i === messages.length - 1 ? (
                              <span className="inline-flex gap-1">
                                <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div className="border-t border-white/[0.02] bg-[#0d0d1a] shrink-0">
          <div className="mx-auto max-w-3xl px-4 pt-2 pb-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {(mode === 'research' ? [
                { icon: <AlignLeft className="h-3 w-3" />, label: 'Outline', prompt: 'Help me outline a research paper on' },
                { icon: <FileText className="h-3 w-3" />, label: 'Abstract', prompt: 'Write an abstract for a paper about' },
                { icon: <Search className="h-3 w-3" />, label: 'Find Papers', prompt: 'Find recent papers about' },
                { icon: <Quote className="h-3 w-3" />, label: 'Cite', prompt: 'Generate citations in APA format for the topic:' },
              ] : mode === 'mun' ? [
                { icon: <Globe className="h-3 w-3" />, label: 'Position Paper', prompt: 'Write a position paper for ' },
                { icon: <ScrollText className="h-3 w-3" />, label: 'Resolution', prompt: 'Draft a UN resolution on ' },
                { icon: <PenLine className="h-3 w-3" />, label: 'Speech', prompt: 'Write a 1-minute opening speech for ' },
                { icon: <Library className="h-3 w-3" />, label: 'Country Brief', prompt: 'Summarize the stance of ' },
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
              ] : [
                { icon: <ScrollText className="h-3 w-3" />, label: 'Review', prompt: 'Provide a peer review of the following:\n\n' },
                { icon: <Search className="h-3 w-3" />, label: 'Check Methods', prompt: 'Critique the methodology described here:\n\n' },
                { icon: <BookOpen className="h-3 w-3" />, label: 'Check Citations', prompt: 'Are the citations in this section appropriate?\n\n' },
                { icon: <ListChecks className="h-3 w-3" />, label: 'Full Review', prompt: 'Give me a comprehensive peer review:\n\n' },
              ]).map((tool, i) => (
                <button key={i} onClick={() => { setInput(tool.prompt); inputRef.current?.focus(); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors shrink-0 whitespace-nowrap">
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.02] bg-[#0d0d1a] shrink-0">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 focus-within:border-white/[0.12] transition-all">
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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-colors">
                  <span className="text-[10px] font-medium">■</span>
                </button>
              ) : (
                <button onClick={handleSend} disabled={!input.trim()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/40 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/15 text-center mt-2 font-mono">VEDA — {modes.find(m => m.id === mode)?.label || 'Research'} Mode</p>
          </div>
        </div>
      </div>

      {/* Generate Paper Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#11111e] shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <FileDown className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-medium text-white/70">Generate Research Paper</h2>
              </div>
              <button onClick={() => { if (!generating) { setShowGenerate(false); setGenerateTopic(''); } }} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-white/30 mb-3">Enter a topic and VEDA will search arXiv, write a complete paper, and download a DOCX.</p>
            <input
              value={generateTopic}
              onChange={(e) => setGenerateTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') generatePaper(); }}
              placeholder="e.g. Quantum machine learning for drug discovery"
              className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/15 mb-3"
              disabled={generating}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowGenerate(false); setGenerateTopic(''); }}
                className="text-xs px-4 py-2 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
                Cancel
              </button>
              <button onClick={generatePaper} disabled={!generateTopic.trim() || generating}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {generating ? <><span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Generating...</> : <><FileDown className="h-3 w-3" /> Generate Paper</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#11111e] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <Key className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-medium text-white/70">API Keys</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-white/30">Keys are stored locally and never sent anywhere else.</p>
              {providers.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-white/50">{p.label}</label>
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400/50 hover:text-indigo-400">Get key</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys[p.id] ? 'text' : 'password'}
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => setApiKeys({ ...apiKeys, [p.id]: e.target.value })}
                      placeholder={configured[p.id] ? '••••••••' : 'sk-...'}
                      className="w-full h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 pr-9 text-xs text-white/60 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15"
                    />
                    <button onClick={() => setShowKeys({ ...showKeys, [p.id]: !showKeys[p.id] })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                      {showKeys[p.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
              <span className={`text-xs ${keyStatus.includes('Saved') ? 'text-emerald-400' : 'text-white/20'}`}>{keyStatus}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSettings(false)}
                  className="text-xs px-4 py-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-colors">
                  Close
                </button>
                <button onClick={saveKeys}
                  className="text-xs px-4 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
