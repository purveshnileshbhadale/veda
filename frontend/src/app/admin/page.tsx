'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, User, Mail, Calendar, CheckCircle, XCircle, ChevronDown, ChevronRight, Key, Crown, RefreshCw } from 'lucide-react';

let API = 'https://veda-backend-lcjt.onrender.com/api/v1';
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') API = 'http://localhost:8001/api/v1';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'from-red-500 to-rose-500',
  developer: 'from-emerald-500 to-cyan-500',
  researcher: 'from-blue-500 to-violet-500',
  student: 'from-amber-500 to-orange-500',
  professor: 'from-indigo-500 to-purple-500',
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [user, setUser] = useState<{ id: string; role: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promoteRole, setPromoteRole] = useState<string>('developer');
  const [promoteMsg, setPromoteMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchUsers = async () => {
    const t = token();
    if (!t) { router.push('/'); return; }
    try {
      const me = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (!me.ok) { localStorage.removeItem('access_token'); router.push('/'); return; }
      const md = await me.json();
      setUser(md);
      if (md.role !== 'admin') { router.push('/'); return; }
      const r = await fetch(`${API}/auth/users`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (r.ok) setUsers(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const promoteUser = async (username: string) => {
    const t = token();
    if (!t) return;
    setPromoting(username);
    try {
      const r = await fetch(`${API}/auth/promote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ username, role: promoteRole }),
      });
      const d = await r.json();
      setPromoteMsg({ id: username, text: d.message || d.detail, ok: r.ok });
      if (r.ok) fetchUsers();
    } catch { setPromoteMsg({ id: username, text: 'Request failed', ok: false }); }
    setTimeout(() => setPromoteMsg(null), 3000);
    setPromoting(null);
  };

  if (loading) return (
    <div className="h-screen bg-[#07070f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Shield className="h-6 w-6 text-red-400/50" />
        <div className="h-8 w-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/30 font-mono tracking-widest">LOADING</p>
      </div>
    </div>
  );

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07070f] bg-grid">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 mb-8 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          BACK TO VEDA
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white/85">Admin Panel</h1>
            <p className="text-xs text-white/35 font-mono"><span className="text-red-400">{user?.username}</span> &middot; {users.length} users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">TOTAL</div>
            <div className="text-2xl font-bold text-white/85">{users.length}</div>
          </div>
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">ADMINS</div>
            <div className="text-2xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</div>
          </div>
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">DEVELOPERS</div>
            <div className="text-2xl font-bold text-emerald-400">{users.filter(u => u.role === 'developer').length}</div>
          </div>
          <div className="glass rounded-xl border border-white/[0.04] p-4 neon-glow">
            <div className="text-[10px] text-white/25 font-mono tracking-wider mb-1">VERIFIED</div>
            <div className="text-2xl font-bold text-cyan-400">{users.filter(u => u.is_verified).length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl border border-white/[0.06] p-3 mb-5">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by username, name, or email..."
            className="w-full bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20" />
        </div>

        {/* User list */}
        <div className="glass rounded-2xl border border-white/[0.06] neon-glow p-5 mb-5">
          <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-4">
            <User className="h-3 w-3" /> USERS
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-8">No users found</p>
            ) : filtered.map(u => (
              <div key={u.id} className="glass-light rounded-xl border border-white/[0.04]">
                <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${ROLE_COLORS[u.role] || 'from-indigo-500 to-cyan-500'} shadow-sm shrink-0`}>
                    <span className="text-[10px] font-bold text-white">{u.username[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white/80 truncate">{u.full_name || u.username}</span>
                      {u.role === 'admin' && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-red-500/15 text-red-400' :
                        u.role === 'developer' ? 'bg-emerald-500/15 text-emerald-400' :
                        'bg-white/[0.04] text-white/30'
                      }`}>{u.role}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span>@{u.username}</span>
                      {u.email && <span className="truncate hidden sm:inline">{u.email}</span>}
                      <span className="flex items-center gap-1">
                        {u.is_active ? <CheckCircle className="h-2.5 w-2.5 text-emerald-400/50" /> : <XCircle className="h-2.5 w-2.5 text-red-400/50" />}
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                  {expandedUser === u.id ? <ChevronDown className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />}
                </button>
                {expandedUser === u.id && (
                  <div className="px-3.5 pb-3.5 pt-0 border-t border-white/[0.03]">
                    <div className="mt-2 grid grid-cols-2 gap-2 mb-3">
                      <div className="text-[10px] text-white/25"><span className="text-white/40">ID:</span> {u.id}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Email:</span> {u.email || '—'}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Created:</span> {new Date(u.created_at).toLocaleString()}</div>
                      <div className="text-[10px] text-white/25"><span className="text-white/40">Last Login:</span> {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</div>
                    </div>
                    {u.username !== user?.username && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.03]">
                        <select value={promoteRole} onChange={e => setPromoteRole(e.target.value)}
                          className="h-7 text-[10px] bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 text-white/60 outline-none focus:border-emerald-500/30">
                          <option value="developer">Developer</option>
                          <option value="admin">Admin</option>
                          <option value="researcher">Researcher</option>
                          <option value="student">Student</option>
                          <option value="professor">Professor</option>
                        </select>
                        <button onClick={() => promoteUser(u.username)} disabled={promoting === u.username}
                          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all">
                          {promoting === u.username ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
                          Change Role
                        </button>
                        {promoteMsg?.id === u.username && (
                          <span className={`text-[10px] ${promoteMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                            {promoteMsg.text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-amber-400/70 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white/60 mb-1">Admin Only</p>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Role changes take effect immediately. Users may need to log out and back in for frontend role checks to update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
