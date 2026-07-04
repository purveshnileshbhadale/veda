'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building, BookOpen, Sparkles, ArrowLeft, Save, Shield, Calendar, CheckCircle, Globe, Github, Link as LinkIcon, GraduationCap, RefreshCw } from 'lucide-react';

let API = 'https://veda-backend-lcjt.onrender.com/api/v1';
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') API = 'http://localhost:8001/api/v1';

interface UserData {
  id: string; email: string; username: string; full_name: string;
  role: string; institution: string | null; department: string | null;
  research_interests: string[]; is_verified: boolean; created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [researchInterests, setResearchInterests] = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchProfile = async () => {
    const t = token();
    if (!t) { router.push('/'); return; }
    try {
      const r = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (!r.ok) { localStorage.removeItem('access_token'); router.push('/'); return; }
      const d = await r.json();
      setUser(d);
      setFullName(d.full_name || '');
      setInstitution(d.institution || '');
      setDepartment(d.department || '');
      setResearchInterests((d.research_interests || []).join(', '));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async () => {
    const t = token();
    if (!t) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/auth/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({
          full_name: fullName.trim() || undefined,
          institution: institution.trim() || undefined,
          department: department.trim() || undefined,
          research_interests: researchInterests.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {}
    setSaving(false);
  };

  if (loading) return (
    <div className="h-screen bg-[#07070f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/30 font-mono tracking-widest">LOADING</p>
      </div>
    </div>
  );

  if (!user) return null;

  const roleColors: Record<string, string> = {
    researcher: 'from-indigo-500 to-cyan-400',
    student: 'from-emerald-500 to-teal-400',
    professor: 'from-violet-500 to-purple-400',
    admin: 'from-rose-500 to-pink-400',
  };

  return (
    <div className="min-h-screen bg-[#07070f] bg-grid">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 mb-8 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          BACK TO VEDA
        </button>

        <div className="glass rounded-2xl border border-white/[0.06] neon-glow overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-8 border-b border-white/[0.04]">
            <div className={`absolute inset-0 bg-gradient-to-br ${roleColors[user.role] || 'from-indigo-500 to-cyan-400'} opacity-[0.04]`} />
            <div className="relative flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-white/85 truncate">{user.full_name || user.username}</h1>
                <p className="text-xs text-white/40 mt-1 font-mono">@{user.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${roleColors[user.role] || 'from-indigo-500 to-cyan-400'} text-white/80 font-medium uppercase tracking-wider`}>
                    {user.role}
                  </span>
                  {user.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-light rounded-xl border border-white/[0.04] p-3.5">
                <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-2">EMAIL</div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="h-3.5 w-3.5 text-indigo-400/50" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              <div className="glass-light rounded-xl border border-white/[0.04] p-3.5">
                <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-2">MEMBER SINCE</div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-cyan-400/50" />
                  {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="glass-light rounded-xl border border-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tracking-wider mb-4">EDIT PROFILE</div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/30 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1.5 block">Institution</label>
                  <div className="relative">
                    <Building className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={institution} onChange={(e) => setInstitution(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" placeholder="University / Organization" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1.5 block">Department</label>
                  <div className="relative">
                    <BookOpen className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15" placeholder="Department / Division" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1.5 block">Research Interests (comma separated)</label>
                  <div className="relative">
                    <GraduationCap className="h-3.5 w-3.5 absolute left-3 top-2.5 text-white/20" />
                    <textarea value={researchInterests} onChange={(e) => setResearchInterests(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 py-2 text-sm text-white/70 outline-none focus:border-indigo-500/30 transition-colors placeholder:text-white/15 resize-none" rows={2} placeholder="Machine Learning, NLP, Computational Biology" />
                  </div>
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="mt-4 flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-400 hover:from-indigo-500/30 hover:to-cyan-500/30 border border-indigo-500/10 transition-all disabled:opacity-50">
                {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : saved ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
