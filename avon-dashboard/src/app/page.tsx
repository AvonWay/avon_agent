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
    inviteMember,
    deleteSite
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
    CloudLightning,
    Bot,
    Send
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

const SiteCard = ({ id, name, url, status, onDelete }: { id: string, name: string, url: string, status: string, onDelete: (e: React.MouseEvent, id: string) => void }) => {
    const isBuilding = status === 'Building' || status === 'queued';
    const href = `http://localhost:3001/?id=${id}`;

    return (
        <div
            onClick={() => !isBuilding && window.open(href, '_blank')}
            className={`bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative ${!isBuilding ? 'cursor-pointer' : 'cursor-wait'}`}
        >
            <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                {!isBuilding && (
                    <button
                        onClick={(e) => onDelete(e, id)}
                        className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
                        title="Decommission Node"
                    >
                        <X size={14} />
                    </button>
                )}
                {isBuilding ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Building Node...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-gray-200 group-hover:scale-110 transition-transform duration-500"><Globe size={48} /></div>
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
                </div>
            </div>
        </div>
    );
};

// --- Dashboard ---

export default function Dashboard() {
    const [websites, setWebsites] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'dashboard' | 'team' | 'activity' | 'ai-builder'>('dashboard');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const [newProjectPrompt, setNewProjectPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('vibe-01');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);

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

    const handleCreateWebsite = async (overridePrompt?: string) => {
        const prompt = overridePrompt || newProjectPrompt;
        if (!prompt.trim() || !authToken) return;
        setIsBuilding(true);
        try {
            const buildData = await generateSite(authToken, prompt, selectedTemplate);
            if (buildData.node_id) {
                await supabase.from('tasks').insert([{ text: prompt, completed: false }]).select();
                const updatedSites = await fetchSites(authToken);
                setWebsites(updatedSites);
                setIsModalOpen(false);
                setNewProjectPrompt('');
                return buildData.plan;
            }
        } catch (err: any) { console.error(err); } finally { setIsBuilding(false); }
    };

    const handleDeleteNode = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!authToken) return;
        try {
            const res = await deleteSite(authToken, id);
            if (res.success) {
                const updatedSites = await fetchSites(authToken);
                setWebsites(updatedSites);
                const updatedActs = await fetchActivity(authToken, activeWorkspace.id);
                setActivities(updatedActs);
            }
        } catch (err) { console.error(err); }
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || !authToken) return;
        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        setIsBuilding(true);
        try {
            // Send to Avon for Build
            const plan = await handleCreateWebsite(userMsg);
            if (plan) {
                setChatMessages(prev => [...prev, { role: 'avon', content: `Building initiated! Build Plan Scoped:\n\n${plan}` }]);
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'avon', content: 'Velocity Error: Avon is currently offline.' }]);
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans text-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shrink-0 overflow-y-auto">
                <div className="flex items-center gap-2 px-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg italic font-black text-white">A</div>
                    <span className="text-2xl font-black tracking-tight text-gray-900 italic">Avon</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Nodes" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <SidebarItem icon={Zap} label="AI Builder" active={activeView === 'ai-builder'} onClick={() => setActiveView('ai-builder')} />
                    <SidebarItem icon={Users} label="Team" active={activeView === 'team'} onClick={() => setActiveView('team')} />
                    <SidebarItem icon={Activity} label="CI/CD Log" active={activeView === 'activity'} onClick={() => setActiveView('activity')} />
                </nav>

                <div className="mt-8 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Factories</p>
                    {workspaces.map(ws => (
                        <button key={ws.id} onClick={() => handleSwitchWorkspace(ws.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeWorkspace?.id === ws.id ? 'bg-blue-600 text-white font-bold' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Building2 size={14} /> <span className="text-xs truncate font-bold uppercase">{ws.name}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-6">
                    <div className="p-5 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase">{userRole} TIER</p>
                            {userRole !== 'industrial' && (<button onClick={() => setIsPricingOpen(true)} className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">UPGRADE</button>)}
                        </div>
                        <div className="flex items-center gap-2">
                            <CloudLightning size={14} className="text-blue-400 animate-pulse" />
                            <span className="text-[11px] text-gray-300 font-extrabold uppercase tracking-tight italic">Velocity Active</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="relative w-96 font-medium">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search industrial nodes..." className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10" />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-xl shadow-blue-50 transition-all hover:scale-105">
                        <Plus size={18} /> Initialize Node
                    </button>
                </header>

                <section className="flex-1 p-8 overflow-y-auto">
                    {loading ? (<div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>) : (
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-10 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">{activeView.replace('-', ' ')}</h1>
                                    <p className="text-gray-400 text-xs font-bold uppercase mt-2">{activeWorkspace?.name} — Industrial Orchestration</p>
                                </div>
                            </div>

                            {activeView === 'dashboard' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                    {websites.map((site: any) => (<SiteCard key={site.id} id={site.id} name={site.name} url={site.domain} status={site.status} onDelete={handleDeleteNode} />))}
                                    <div onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-blue-50/30 transition-all group min-h-[240px] cursor-pointer">
                                        <Plus className="text-gray-200 group-hover:text-blue-600 transition-colors mb-4" size={48} />
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Manual Node</span>
                                    </div>
                                </div>
                            )}

                            {activeView === 'ai-builder' && (
                                <div className="max-w-4xl mx-auto h-[calc(100vh-250px)] flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-600 text-white">
                                        <div className="flex items-center gap-3"> <Bot size={24} /> <span className="font-black italic uppercase tracking-tight">Avon AI Builder</span> </div>
                                        <div className="text-[10px] font-bold px-2 py-1 bg-white/20 rounded uppercase">Velocity Multiplier: 100x</div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                                        {chatMessages.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                                                <Bot size={64} className="mb-4 text-blue-600" />
                                                <p className="text-xl font-black uppercase italic tracking-tighter">Velocity Pulse Active</p>
                                                <p className="text-sm font-medium">Avon is ready to materialize your industrial intent.</p>
                                            </div>
                                        )}
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm border ${msg.role === 'user' ? 'bg-white border-blue-50 text-gray-800' : 'bg-gray-900 border-gray-800 text-gray-300'}`}>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">{msg.role === 'user' ? 'Command' : 'Avon Protocol'}</p>
                                                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isBuilding && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-900 p-4 rounded-3xl flex items-center gap-3 border border-gray-800 shadow-xl">
                                                    <Loader2 size={16} className="text-blue-500 animate-spin" />
                                                    <span className="text-xs font-black uppercase text-blue-500 italic animate-pulse">Avon is building node...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 bg-white border-t border-gray-50">
                                        <div className="relative flex items-center">
                                            <input
                                                value={chatInput}
                                                onChange={e => setChatInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                                                placeholder="Scale a high-velocity dashboard with dark mode and analytics..."
                                                className="w-full pl-6 pr-16 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all text-gray-800"
                                            />
                                            <button onClick={handleChatSubmit} className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
                                                <Send size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeView === 'team' && (
                                <div className="space-y-4 max-w-4xl pb-20">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-black italic uppercase">Collaborators</h2>
                                        <button onClick={() => setIsInviteOpen(true)} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">Invite Specialist</button>
                                    </div>
                                    {members.map((member, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:translate-x-2 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <img src={member.avatar} className="w-12 h-12 rounded-2xl shadow-sm border-2 border-white" />
                                                <div><p className="font-black text-gray-800 italic uppercase underline decoration-blue-600/30">{member.username}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.email}</p></div>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">{member.role}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeView === 'activity' && (
                                <div className="max-w-4xl mx-auto space-y-4 pb-20">
                                    {activities.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm italic font-medium text-sm text-gray-600 border-l-4 border-l-blue-600 transition-all hover:translate-x-1">
                                            <Clock size={16} className="text-blue-500" />
                                            <span><span className="font-black text-gray-900 underline">@{item.user}</span> {item.action} <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-xs font-black text-blue-600">{item.target}</span></span>
                                            <span className="ml-auto text-[10px] font-black uppercase opacity-20 tracking-widest">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* Manual Build Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-2xl animate-in zoom-in duration-300 border-4 border-blue-600/5">
                        <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black italic uppercase tracking-tighter">Manual Node Trigger</h2><button onClick={() => setIsModalOpen(false)} className="bg-gray-50 p-3 rounded-full"><X size={24} /></button></div>
                        <textarea
                            value={newProjectPrompt}
                            onChange={e => setNewProjectPrompt(e.target.value)}
                            rows={5}
                            placeholder="Declare industrial intent..."
                            className="w-full p-8 bg-gray-50 border-none rounded-[2.5rem] mb-10 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold text-gray-700 italic"
                        />
                        <button onClick={() => handleCreateWebsite()} className="w-full py-6 bg-blue-600 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95">Trigger Build Protocol</button>
                    </div>
                </div>
            )}
        </div>
    );
}
