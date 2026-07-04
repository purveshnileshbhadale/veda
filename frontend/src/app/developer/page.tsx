'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, Shield, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Terminal, Cpu, Database, Globe, Lock, Wifi, User, Mail, MessageSquare, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

let API = 'https://veda-backend-lcjt.onrender.com/api/v1';
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') API = 'http://localhost:8001/api/v1';

interface KeyStatus {
  configured: Record<string, boolean>;
  providers: string[];
}

interface BackendHealth {
  status: string;
  version?: string;
}

interface AdminConversation {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: string;
  role: string;
  username: string;
  full_name: string;
  email: string;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  gemini: <Cpu className="h-3.5 w-3.5" />,
  groq: <ZapIcon className="h-3.5 w-3.5" />,
  openrouter: <Wifi className="h-3.5 w-3.5" />,
  deepseek: <Database className="h-3.5 w-3.5" />,
};

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'from-blue-500 to-violet-500',
  groq: 'from-orange-500 to-red-500',
  openrouter: 'from-cyan-500 to-blue-500',
  deepseek: 'from-emerald-500 to-teal-500',
};

export default function DeveloperPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [keys, setKeys] = useState<KeyStatus | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState('');
  const [savedProvider, setSavedProvider] = useState('');
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [convStats, setConvStats] = useState({ total: 0, users: 0, avgMessages: 0 });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchData = async () => {
    const t = token();
    if (!t) { router.push('/'); return; }
    try {
      const [me, kr, hr, cr] = await Promise.all([
        fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${t}` } }),
        fetch(`${API}/auth/keys`, { headers: { 'Authorization': `Bearer ${t}` } }),
        fetch(`${API}/health`).catch(() => null),
        fetch(`${API}/conversations/all`, { headers: { 'Authorization': `Bearer ${t}` } }).catch(() => null),
      ]);
      if (!me.ok || !kr.ok) { localStorage.removeItem('access_token'); router.push('/'); return; }
      const md = await me.json();
      setUser(md);
      if (md.role !== 'developer' && md.role !== 'admin') { router.push('/'); return; }
      const kd = await kr.json(); setKeys(kd);
      if (hr?.ok) { const hd = await hr.json(); setHealth(hd); }
      if (cr?.ok) {
        const cd: AdminConversation[] = await cr.json();
        setConversations(cd);
        const uniqueUsers = new Set(cd.map(c => c.user_id));
        const totalMsgs = cd.reduce((sum, c) => sum + c.messages.length, 0);
        setConvStats({
          total: cd.length,
          users: uniqueUsers.size,
          avgMessages: cd.length ? Math.round(totalMsgs / cd.length) : 0,
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveKey = async (provider: string) => {
    const val = keyInputs[provider]?.trim();
    if (!val) return;
    const t = token();
    if (!t) return;
    setSaving(provider);
    try {
      const r = await fetch(`${API}/auth/keys`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ [provider]: val }),
      });
      if (r.ok) {
        setSavedProvider(provider);
        setTimeout(() => setSavedProvider(''), 2000);
        setKeyInputs(prev => ({ ...prev, [provider]: '' }));
        fetchData();
      }
    } catch {}
    setSaving('');
  };

  const deleteConversation = async (convId: string) => {
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API}/conversations/${convId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` },
      });
      setConversations(prev => prev.filter(c => c.id !== convId));
    } catch {}
  };

  if (loading) return (
    <div className="h-screen bg-[#07070f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Terminal className="h-6 w-6 text-emerald-400/50" />
        <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/30 font-mono tracking-widest">INITIALIZING</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07070f] bg-grid">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 mb-8 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          BACK TO VEDA
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white/85">Developer Dashboard</h1>
            <p className="text-xs text-white/35 font-mono">Signed in as <span className="text-emerald-400">{user?.username}</span> ({user?.role})</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">CONVERSATIONS</div>
            <div className="text-2xl font-bold text-white/85">{convStats.total}</div>
          </div>
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">USERS</div>
            <div className="text-2xl font-bold text-white/85">{convStats.users}</div>
          </div>
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">AVG MESSAGES</div>
            <div className="text-2xl font-bold text-white/85">{convStats.avgMessages}</div>
          </div>
        </div>

        {/* System Status */}
        <div className="glass rounded-2xl border border-white/[0.06] neon-glow p-5 mb-5">
          <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-4">
            <Wifi className="h-3 w-3" /> SYSTEM STATUS
          </div>
          <div className="flex gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${health?.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} text-xs`}>
              {health?.status === 'ok' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Backend {health?.status === 'ok' ? 'Online' : 'Offline'}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs">
              <Globe className="h-3.5 w-3.5" />
              {API.replace('https://', '').replace('/api/v1', '')}
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="glass rounded-2xl border border-white/[0.06] neon-glow p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider">
              <Key className="h-3 w-3" /> API PROVIDERS
            </div>
            <button onClick={() => setShowKeys(!showKeys)}
              className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors">
              {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showKeys ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="space-y-2">
            {(keys?.providers || []).map(provider => (
              <div key={provider} className="glass-light rounded-xl border border-white/[0.04] p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${PROVIDER_COLORS[provider] || 'from-indigo-500 to-cyan-500'} shadow-sm`}>
                      {PROVIDER_ICONS[provider] || <Cpu className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-white/70 capitalize">{provider}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] ${keys?.configured[provider] ? 'text-emerald-400/70' : 'text-red-400/50'}`}>
                    {keys?.configured[provider] ? <><CheckCircle className="h-3 w-3" /> Configured</> : <><XCircle className="h-3 w-3" /> Not Set</>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className={`h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${showKeys ? 'text-white/30' : 'text-emerald-400/50'}`} />
                    <input value={keyInputs[provider] || ''} onChange={(e) => setKeyInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                      type={showKeys ? 'text' : 'password'} placeholder={keys?.configured[provider] ? 'Replace existing key...' : 'Enter API key...'}
                      className="w-full h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-2 text-xs text-white/70 outline-none focus:border-emerald-500/30 transition-colors placeholder:text-white/12 font-mono" />
                  </div>
                  <button onClick={() => saveKey(provider)} disabled={!keyInputs[provider]?.trim() || saving === provider}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all shrink-0">
                    {saving === provider ? <RefreshCw className="h-3 w-3 animate-spin" /> : savedProvider === provider ? <CheckCircle className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                    {saving === provider ? '' : savedProvider === provider ? '' : 'Set'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Conversations */}
        <div className="glass rounded-2xl border border-white/[0.06] neon-glow p-5 mb-5">
          <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-4">
            <MessageSquare className="h-3 w-3" /> ALL CONVERSATIONS ({conversations.length})
          </div>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-8">No conversations found</p>
            ) : conversations.map(conv => (
              <div key={conv.id} className="glass-light rounded-xl border border-white/[0.04]">
                <button onClick={() => setExpandedConv(expandedConv === conv.id ? null : conv.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/70 truncate">{conv.title}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{conv.messages.length} msgs</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{conv.username}</span>
                      {conv.full_name && <span>{conv.full_name}</span>}
                      {conv.email && <span className="truncate hidden md:inline">{conv.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="text-white/15 hover:text-red-400 p-1 rounded-md hover:bg-white/[0.03] transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {expandedConv === conv.id ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronRight className="h-3 w-3 text-white/30" />}
                  </div>
                </button>
                {expandedConv === conv.id && (
                  <div className="px-3.5 pb-3 pt-0 border-t border-white/[0.03]">
                    <div className="mt-2 grid grid-cols-2 gap-2 mb-2">
                      <div className="text-[10px] text-white/25"><span className="text-white/40">User ID:</span> {conv.user_id}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Conv ID:</span> {conv.id}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Created:</span> {new Date(conv.created_at).toLocaleString()}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Updated:</span> {new Date(conv.updated_at).toLocaleString()}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Full Name:</span> {conv.full_name || '—'}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Email:</span> {conv.email || '—'}</div>
                    </div>
                    {conv.messages.length > 0 && (
                      <div className="bg-white/[0.02] rounded-lg p-2.5 max-h-60 overflow-y-auto space-y-1.5">
                        {conv.messages.slice(-10).map((msg, i) => (
                          <div key={i} className="text-[10px]">
                            <span className={`font-medium ${msg.role === 'user' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                              {msg.role === 'user' ? 'USER' : 'ASSISTANT'}:
                            </span>
                            <span className="text-white/40 ml-1">{msg.content?.slice(0, 200)}{msg.content?.length > 200 ? '...' : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="glass rounded-2xl border border-white/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-amber-400/70 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white/60 mb-1">Security Notice</p>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Developer access restricted to developer and admin roles. User data is protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
