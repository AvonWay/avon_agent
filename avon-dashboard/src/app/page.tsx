"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchSites,
    generateSite,
    login,
    fetchTemplates,
    upgradeAccount,
    fetchWorkspaces,
    switchWorkspace,
    fetchMembers,
    fetchActivity,
    inviteMember
} from '@/lib/api';
import {
    LayoutDashboard,
    Globe,
    Zap,
    Settings,
    Plus,
    MoreVertical,
    ExternalLink,
    ChevronLeft,
    ChevronDown,
    Search,
    X,
    Loader2,
    Terminal as TerminalIcon,
    Lock,
    Check,
    ShieldCheck,
    Star,
    Users,
    Building2,
    FolderOpen,
    UserPlus,
    Mail,
    MoreHorizontal,
    Activity,
    Clock,
    ArrowRight,
    RefreshCcw,
    CloudLightning
} from 'lucide-react';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-lg mb-1
    ${active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
    >
        <Icon size={20} />
        <span className="text-sm">{label}</span>
    </div>
);

const SiteCard = ({ name, url, status }: { name: string, url: string, status: string }) => {
    const isBuilding = status === 'Building' || status === 'queued';

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                {isBuilding ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">CI/CD Deploying...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-gray-200 group-hover:scale-110 transition-transform duration-500">
                            <Globe size={48} />
                        </div>
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 absolute shadow-lg">
                            <ExternalLink size={20} className="text-blue-600" />
                        </div>
                    </>
                )}
            </div>
            <div className="p-4 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm truncate w-32">{name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium truncate w-32">{url}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 ${!isBuilding ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} text-[9px] font-black rounded-full uppercase tracking-widest`}>
                        {status}
                    </span>
                    <button title="Options" className="text-gray-300 hover:text-gray-600 transition-colors p-1">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberRow = ({ member }: { member: any }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-all group">
        <div className="flex items-center gap-4">
            <img src={member.avatar} alt={member.username} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div>
                <p className="text-sm font-bold text-gray-900">{member.username}</p>
                <p className="text-xs text-gray-400 font-medium">{member.email}</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full
            ${member.role === 'Owner' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                {member.role}
            </span>
            <button title="Member Actions" className="text-gray-400 hover:text-gray-900 transition-colors">
                <MoreHorizontal size={18} />
            </button>
        </div>
    </div>
);

const ActivityRow = ({ item }: { item: any }) => (
    <div className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-100 transition-all group">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Clock size={18} />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-blue-600">@{item.user}</span> {item.action}
                    <span className="ml-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded border border-gray-100">{item.target}</span>
                </p>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    </div>
);

// --- Main Dashboard ---

const TIER_HIERARCHY: Record<string, number> = { 'free': 1, 'pro': 2, 'industrial': 3 };

const PLANS = [
    { role: 'free', name: 'Starter', price: '$0', features: ['Basic AI'], color: 'bg-gray-100', icon: <Users size={24} /> },
    { role: 'pro', name: 'Pro', price: '$49', features: ['SaaS Build'], color: 'bg-amber-100', icon: <Star size={24} />, popular: true },
    { role: 'industrial', name: 'Industrial', price: '$299', features: ['1k Sites/mo'], color: 'bg-blue-600', icon: <Zap size={24} className="text-white" /> }
];

export default function Dashboard() {
    const [websites, setWebsites] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'dashboard' | 'team' | 'activity'>('dashboard');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const [newProjectPrompt, setNewProjectPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('vibe-01');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Editor');

    const [isBuilding, setIsBuilding] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('free');

    useEffect(() => { initDashboard(); }, []);

    // Poll for site updates while building
    useEffect(() => {
        let interval: any;
        if (websites.some(s => s.status === 'Building')) {
            interval = setInterval(async () => {
                if (authToken) {
                    const updatedSites = await fetchSites(authToken);
                    setWebsites(updatedSites);
                    const updatedActs = await fetchActivity(authToken, activeWorkspace.id);
                    setActivities(updatedActs);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [websites, authToken, activeWorkspace]);

    const initDashboard = async (roleOverride?: string) => {
        setLoading(true);
        try {
            const auth = await login('avon_admin', roleOverride || 'free');
            setAuthToken(auth.token);
            setUserRole(auth.role);
            const [sites, tpl, ws] = await Promise.all([
                fetchSites(auth.token),
                fetchTemplates(auth.token),
                fetchWorkspaces(auth.token)
            ]);
            setWebsites(sites);
            setTemplates(tpl);
            setWorkspaces(ws);
            const active = ws[0];
            setActiveWorkspace(active);
            const [mems, acts] = await Promise.all([
                fetchMembers(auth.token, active.id),
                fetchActivity(auth.token, active.id)
            ]);
            setMembers(mems);
            setActivities(acts);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSwitchWorkspace = async (wsId: string) => {
        if (!authToken) return;
        setLoading(true);
        try {
            const res = await switchWorkspace(authToken, wsId);
            if (res.success) {
                setAuthToken(res.token);
                setActiveWorkspace(res.workspace);
                const [sites, mems, acts] = await Promise.all([
                    fetchSites(res.token),
                    fetchMembers(res.token, wsId),
                    fetchActivity(res.token, wsId)
                ]);
                setWebsites(sites);
                setMembers(mems);
                setActivities(acts);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleCreateWebsite = async () => {
        if (!newProjectPrompt.trim() || !authToken) return;
        setIsBuilding(true);
        try {
            const buildData = await generateSite(authToken, newProjectPrompt, selectedTemplate);
            if (buildData.node_id) {
                await supabase.from('tasks').insert([{ text: newProjectPrompt, completed: false }]).select();
                const updatedSites = await fetchSites(authToken);
                setWebsites(updatedSites);
                setIsModalOpen(false);
                setNewProjectPrompt('');
            }
        } catch (err: any) { console.error(err); } finally { setIsBuilding(false); }
    };

    const handleUpgrade = async (role: string) => {
        if (!authToken) return;
        try {
            const res = await upgradeAccount(authToken, role);
            if (res.success) {
                setAuthToken(res.token);
                setUserRole(res.role);
                setIsPricingOpen(false);
                const newTemplates = await fetchTemplates(res.token);
                setTemplates(newTemplates);
            }
        } catch (err) { console.error('Upgrade failed:', err); }
    };

    const handleInvite = async () => {
        if (!authToken || !activeWorkspace || !inviteEmail) return;
        try {
            const res = await inviteMember(authToken, activeWorkspace.id, inviteEmail, inviteRole);
            if (res.success) {
                setInviteEmail('');
                setIsInviteOpen(false);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans text-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shrink-0 overflow-y-auto">
                <div className="flex items-center gap-2 px-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100 italic font-black text-white">A</div>
                    <span className="text-2xl font-black tracking-tight text-gray-900 italic">Avon</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Nodes" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <SidebarItem icon={Users} label="Collaborators" active={activeView === 'team'} onClick={() => setActiveView('team')} />
                    <SidebarItem icon={Activity} label="CI/CD Log" active={activeView === 'activity'} onClick={() => setActiveView('activity')} />
                    <SidebarItem icon={Settings} label="Factory Params" />
                </nav>

                {/* Workspace Quick-Switch */}
                <div className="mt-8 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Active Factory</p>
                    {workspaces.map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => handleSwitchWorkspace(ws.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                    ${activeWorkspace?.id === ws.id ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Building2 size={14} className={activeWorkspace?.id === ws.id ? 'text-white' : 'text-gray-400'} />
                            <span className="text-xs truncate font-bold uppercase">{ws.name}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-6">
                    <div className="p-5 bg-blue-600 rounded-2xl border border-blue-500 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white/10 blur-[40px] rounded-full" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">{userRole} TIER</p>
                                {userRole !== 'industrial' && (
                                    <button onClick={() => setIsPricingOpen(true)} className="text-[9px] font-black bg-white text-blue-600 px-2.5 py-1 rounded-full hover:bg-blue-50 transition-colors shadow-sm">UPGRADE</button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CloudLightning size={14} className="text-white animate-pulse" />
                                <span className="text-[11px] text-white font-black uppercase tracking-tight">System High-Velocity</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search production nodes..."
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-700"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-xl shadow-blue-50 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        Initialize Factory Node
                    </button>
                </header>

                <section className="flex-1 p-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                    ) : (
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-12 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                                        {activeView === 'dashboard' ? 'Industrial Fleet' : activeView === 'team' ? 'Collaboration Site' : 'Production Logs'}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{activeWorkspace?.name} • Node Count: {websites.length}</p>
                                    </div>
                                </div>
                                {activeView === 'team' && (
                                    <button onClick={() => setIsInviteOpen(true)} className="bg-white border-2 border-gray-100 hover:border-blue-600 text-gray-900 px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-sm"><UserPlus size={18} /> Add Specialist</button>
                                )}
                            </div>

                            {activeView === 'dashboard' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                    {websites.map((site: any) => (
                                        <SiteCard key={site.id} name={site.name} url={site.domain} status={site.status} />
                                    ))}
                                    <div
                                        onClick={() => setIsModalOpen(true)}
                                        className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-blue-50/30 hover:border-blue-200 cursor-pointer transition-all group min-h-[240px] bg-gray-50/20"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center group-hover:bg-white shadow-sm transition-colors mb-4 border border-gray-100">
                                            <Plus className="text-gray-300 group-hover:text-blue-600" size={28} />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-[0.2em]">Deploy Node</span>
                                    </div>
                                </div>
                            )}

                            {activeView === 'team' && (
                                <div className="space-y-4 max-w-4xl pb-20">
                                    {members.map(member => <MemberRow key={member.id} member={member} />)}
                                </div>
                            )}

                            {activeView === 'activity' && (
                                <div className="space-y-4 max-w-4xl pb-20">
                                    {activities.map(item => <ActivityRow key={item.id} item={item} />)}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* Industrial Modals */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl animate-in zoom-in duration-300 border border-white/20">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                                    <CloudLightning className="text-white" size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Scale Node</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-50 p-2.5 rounded-full hover:bg-gray-100"><X size={24} /></button>
                        </div>
                        <textarea
                            value={newProjectPrompt}
                            onChange={e => setNewProjectPrompt(e.target.value)}
                            rows={5}
                            placeholder="Declare industrial intent..."
                            className="w-full p-8 bg-gray-50 border-2 border-gray-50 rounded-[2.5rem] mb-10 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none text-base font-bold text-gray-800 placeholder:text-gray-300"
                        />
                        <button onClick={handleCreateWebsite} className="w-full py-6 bg-blue-600 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isBuilding ? <Loader2 className="animate-spin" /> : <>Trigger Deployment Sequence <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            )}

            {/* Pricing Modal */}
            {isPricingOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-5xl p-16 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
                        <button onClick={() => setIsPricingOpen(false)} className="absolute top-12 right-12 text-gray-400 hover:text-gray-900"><X size={32} /></button>
                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-4 italic">Industrial Tiers</h2>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Unlock ultra-high-velocity site generation</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {PLANS.map(plan => (
                                <div key={plan.role} className={`p-12 rounded-[3rem] border-2 transition-all relative flex flex-col ${plan.role === userRole ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 hover:border-gray-100'} ${plan.popular ? 'shadow-2xl scale-110 z-10 border-blue-200' : ''}`}>
                                    {plan.popular && <div className="absolute top-[-18px] left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">Recommended</div>}
                                    <div className={`w-16 h-16 ${plan.color} rounded-[1.5rem] mb-10 flex items-center justify-center shadow-lg`}>{plan.icon}</div>
                                    <h3 className="text-2xl font-black mb-1">{plan.name}</h3><div className="mb-12"><span className="text-4xl font-black">{plan.price}</span><span className="text-sm font-bold text-gray-400 ml-1">/MO</span></div>
                                    <button disabled={plan.role === userRole} onClick={() => handleUpgrade(plan.role)} className={`mt-auto w-full py-5 rounded-[1.5rem] font-black text-base transition-all ${plan.role === userRole ? 'bg-gray-100 text-gray-400 cursor-default uppercase tracking-widest' : 'bg-blue-600 text-white shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95'}`}>
                                        {plan.role === userRole ? 'Active' : `Select ${plan.name}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
