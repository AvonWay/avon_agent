"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchSites, generateSite, login, fetchTemplates, fetchWorkspaces,
    switchWorkspace, fetchMembers, fetchActivity, deleteSite, checkConfig, updateConfig,
    executeCommand, listFiles, readFile, writeFile
} from '@/lib/api';
import {
    Files, Search, GitGraph, Play, Settings, MoreHorizontal, X,
    ChevronRight, ChevronDown, Terminal, Globe, Plus, Cpu, Shield,
    Sun, Moon, Box, Activity, User, Zap, Code, Send, RefreshCw, Folder, File, MessageSquare
} from 'lucide-react';

const TerminalComponent = ({ lines, onCommand, height, onClose, problems = [], onFixProblem }: any) => {
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState('terminal');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'terminal') {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lines, activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onCommand(input);
            setInput('');
        }
    };

    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.style.height = `${height}px`;
        }
    }, [height]);

    const tabs = [
        { id: 'problems', label: `Problems (${problems.length})` },
        { id: 'output', label: 'Output' },
        { id: 'debug', label: 'Debug Console' },
        { id: 'terminal', label: 'Terminal' }
    ];

    return (
        <div ref={terminalRef} className="terminal-panel flex flex-col relative z-40 text-sm shadow-inner transition-colors duration-300">
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-4 bg-[var(--terminal-border)] text-[var(--terminal-fg)] text-xs font-bold uppercase tracking-wider select-none border-b border-[var(--terminal-border)] opacity-90">
                <div className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600' : 'border-transparent hover:border-blue-400 opacity-60'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <X size={14} className="cursor-pointer hover:text-red-500 opacity-60" onClick={onClose} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-[var(--terminal-bg)]">
                {activeTab === 'terminal' && (
                    <div className="p-3 space-y-1 font-mono">
                        {lines.map((line: string, i: number) => (
                            <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                        ))}
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-green-600 font-bold">➜</span>
                            <span className="text-blue-600 font-bold">~/velocity</span>
                            <input
                                id="terminal-input"
                                title="Terminal Input"
                                className="flex-1 bg-transparent border-none outline-none font-bold font-mono ml-1 text-[var(--terminal-fg)] placeholder-blue-300"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type command..."
                            />
                        </div>
                        <div ref={endRef} />
                    </div>
                )}

                {activeTab === 'problems' && (
                    <div className="divide-y divide-blue-100">
                        {problems.length > 0 ? (
                            problems.map((prob: any, i: number) => (
                                <div key={i} className="p-3 flex items-start justify-between group hover:bg-blue-50 transition-colors">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 ${prob.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{prob.message}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{prob.path} [Line {prob.line}]</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onFixProblem(prob)}
                                        className="hidden group-hover:flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded text-xs transition-all hover:bg-blue-700 shadow-sm"
                                    >
                                        <Zap size={12} fill="white" />
                                        Fix with Agent
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                                <Activity size={32} className="mb-2 opacity-20" />
                                <p>No problems detected in the current workspace.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'output' && (
                    <div className="p-4 font-mono text-gray-600 space-y-2">
                        <div className="flex items-center gap-2 text-xs border-b border-gray-100 pb-2 mb-2">
                            <span className="text-blue-600 font-bold">SHOW OUTPUT FROM:</span>
                            <select
                                aria-label="Select Output Source"
                                title="Select Output Source"
                                className="bg-transparent border-none outline-none cursor-pointer hover:text-blue-700"
                            >
                                <option>Velocity Compiler (v2.1)</option>
                                <option>Node Runtime</option>
                                <option>Linters (ESLint)</option>
                            </select>
                        </div>
                        <p className="opacity-60">[11:20:41 PM] Building node-173998... (Tone: Light Blue)</p>
                        <p className="opacity-60">[11:20:45 PM] Initializing layout engine...</p>
                        <p className="text-blue-600 font-bold">Successfully generated 12 containers and 4 responsive rules.</p>
                    </div>
                )}

                {activeTab === 'debug' && (
                    <div className="p-4 flex flex-col items-center justify-center h-full text-gray-400">
                        <Cpu size={32} className="mb-2 opacity-20" />
                        <p className="text-xs uppercase tracking-widest font-bold">Debug Session Inactive</p>
                        <button className="mt-4 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-all text-xs border border-gray-200">Start Debugging</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App ---

export default function VelocityIDE() {
    // --- State ---
    const [websites, setWebsites] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Layout
    const [activeTab, setActiveTab] = useState('welcome');
    const [openTabs, setOpenTabs] = useState<any[]>([{ id: 'welcome', title: 'Dashboard', type: 'page' }]);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [terminalVisible, setTerminalVisible] = useState(true);
    const [terminalHeight, setTerminalHeight] = useState(250);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);

    // Data
    const [terminalLines, setTerminalLines] = useState<string[]>(['Velocity Shell v2.1 (Light Blue Theme)', 'Type "help" to start.']);
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isBuilding, setIsBuilding] = useState(false);
    const [problems, setProblems] = useState<any[]>([
        { id: 'p1', source: 'Compiler', severity: 'error', message: 'Potential hydration mismatch in main layout', path: 'src/app/layout.tsx', line: 12 },
        { id: 'p2', source: 'Accessibility', severity: 'warning', message: 'Image missing alt text', path: 'src/components/WebsiteOverview.tsx', line: 32 }
    ]);
    const [isSwarmMode, setIsSwarmMode] = useState(true);

    useEffect(() => { initIDE(); }, []);

    const initIDE = async () => {
        try {
            const auth = await login('avon_admin', 'industrial');
            setAuthToken(auth.token);
            const [sites, ws] = await Promise.all([fetchSites(auth.token), fetchWorkspaces(auth.token)]);
            setWebsites(sites);
            setWorkspaces(ws);
            setActiveWorkspace(ws[0]);
            setLoading(false);

            // Auto-initiate Swarm Build for the Betting App
            setTimeout(() => {
                const bettingPrompt = "Betting Scraper & Probability Engine (Top 5 Platforms)";
                setChatMessages([
                    { role: 'user', content: bettingPrompt },
                    { role: 'velocity', content: "🔥 SWARM MODE INITIALIZED. Distributing tasks to specialized agents..." }
                ]);
                handleGenerate(bettingPrompt, "Industrial Blue");
            }, 1000);

            printTerminal("System Ready. Swarm Mode: ACTIVE.");
        } catch (e) {
            console.error("Boot Failure", e);
            printTerminal("Error: Failed to connect to Velocity Backend.");
        }
    };

    const printTerminal = (text: string) => {
        setTerminalLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
    };

    const handleFixProblem = (problem: any) => {
        const msg = `Fix problem: "${problem.message}" in ${problem.path} at line ${problem.line}.`;
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        setChatMessages(prev => [...prev, { role: 'velocity', content: `Analyzing the issue in ${problem.path}... I will apply a patch to resolve the ${problem.severity} immediately.` }]);
        printTerminal(`Agent initiated fix for: ${problem.id}`);
    };

    const runCommand = async (cmd: string) => {
        setTerminalLines(prev => [...prev, `➜ ${cmd}`]);
        const args = cmd.trim().split(' ');
        const command = args[0].toLowerCase();

        switch (command) {
            case 'help':
                printTerminal("Available commands:\n  help        - Show this menu\n  clear       - Clear terminal\n  ls          - List generic sites\n  build <prompt> - Generate a new site\n  check       - Check system status\n  (all other commands are sent to industrial shell)");
                break;
            case 'clear': setTerminalLines([]); break;
            case 'ls':
                if (websites.length === 0) printTerminal("No sites found.");
                else printTerminal(websites.map(s => `- ${s.name} (${s.id}) [${s.status}]`).join('\n'));
                break;
            case 'build':
                const prompt = args.slice(1).join(' ');
                if (!prompt) { printTerminal("Error: Missing prompt. Usage: build <prompt>"); return; }
                handleGenerate(prompt, 'Light Blue');
                break;
            case 'check':
                if (authToken) {
                    const status = await checkConfig(authToken);
                    printTerminal(`Supabase: ${status.supabase ? 'OK' : 'MISSING'}\nGitHub: ${status.github ? 'OK' : 'MISSING'}`);
                }
                break;
            default:
                if (authToken) {
                    printTerminal(`Executing shell command: ${cmd}...`);
                    try {
                        const res = await executeCommand(authToken, cmd);
                        if (res.stdout) printTerminal(res.stdout);
                        if (res.stderr) printTerminal(`stderr: ${res.stderr}`);
                        if (res.error) printTerminal(`Error: ${res.error}`);
                    } catch (e: any) {
                        printTerminal(`Internal Error: ${e.message}`);
                    }
                } else {
                    printTerminal(`Command not found: ${command} (Auth required for shell)`);
                }
        }
    };

    const handleGenerate = async (prompt: string, tone: string) => {
        if (!authToken) { printTerminal("Warning: No Auth Token. Simulating build..."); }
        setIsBuilding(true);

        const tempId = `temp_${Date.now()}`;
        const tempName = prompt.substring(0, 15) || "New Site";

        // Add temporary 'Building' site to state
        const pendingSite = {
            id: tempId,
            name: tempName,
            status: 'Building',
            domain: 'initializing...'
        };
        setWebsites(prev => [pendingSite, ...prev]);

        // Open the tab immediately
        handleOpenTab(`preview:${tempId}`, `Build: ${tempName}`, 'preview');

        printTerminal(`Build Request: "${prompt}"...`);

        if (isSwarmMode) {
            printTerminal("🚀 [Swarm Intelligence] Initializing Multi-Agent Pipeline...");
            printTerminal("🤖 [ARCHITECT] Drafting architectural blueprint...");
            await new Promise(r => setTimeout(r, 1000));
            printTerminal("👷 [BUILDER] Executing component synthesis...");
            await new Promise(r => setTimeout(r, 800));
            printTerminal("🛡️ [GUARDIAN] Performing security and linting audit...");
        }

        try {
            const res = await generateSite(authToken!, prompt, 'vibe-01', tone, isSwarmMode ? 'swarm' : 'light');
            if (res.node_id) {
                printTerminal(`Build Initiated: Node ID #${res.node_id}`);
                setChatMessages(prev => [...prev, { role: 'velocity', content: `Building project: "${prompt}". Status is active in terminal.` }]);

                // Replace temp site with real site info in websites list
                setWebsites(prev => prev.map(s => s.id === tempId ? { ...s, id: res.node_id, status: 'Compiling' } : s));

                // Update the tab ID in openTabs to the real node ID
                setOpenTabs(prev => prev.map(t => t.id === `preview:${tempId}` ? { ...t, id: `preview:${res.node_id}`, title: tempName } : t));

                // If the user is still on the temporary tab, switch active tab to the real one
                setActiveTab(prev => prev === `preview:${tempId}` ? `preview:${res.node_id}` : prev);

                setTimeout(async () => {
                    if (authToken) {
                        const sites = await fetchSites(authToken);
                        setWebsites(sites);
                    }
                    printTerminal(`Build Complete: ${prompt}`);
                }, 4000);
            }
        } catch (e: any) {
            printTerminal(`Build Failed: ${e.message}`);
            setWebsites(prev => prev.filter(s => s.id !== tempId));
        } finally { setIsBuilding(false); }
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        if (msg.toLowerCase().includes('build') || msg.toLowerCase().includes('create')) {
            handleGenerate(msg, 'Light Theme');
        } else {
            setTimeout(() => {
                setChatMessages(prev => [...prev, { role: 'velocity', content: `Understood. Use the new button styles to trigger actions directly.` }]);
            }, 1000);
        }
    };

    const handleOpenTab = (id: string, title: string, type: 'page' | 'preview') => {
        if (!openTabs.find(t => t.id === id)) {
            setOpenTabs([...openTabs, { id, title, type }]);
        }
        setActiveTab(id);
    };

    return (
        <div className="flex h-screen w-screen bg-[var(--ide-bg)] text-[var(--ide-fg)] overflow-hidden font-sans">

            {/* 1. Side Bar (Project Explorer) */}
            {sidebarVisible && (
                <div className="w-64 bg-[var(--ide-sidebar)] border-r border-[var(--ide-border)] flex flex-col shrink-0 z-30 shadow-sm">
                    <div className="h-10 px-4 flex items-center justify-between ide-header mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ide-fg)]">Explorer</span>
                        <MoreHorizontal size={16} className="cursor-pointer text-gray-400 hover:text-blue-500" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-1">
                        <div className="flex items-center gap-1 px-2 py-1 font-bold text-xs text-[var(--ide-fg)] cursor-pointer hover:bg-[var(--ide-hover)] rounded">
                            <ChevronDown size={14} />
                            <span className="uppercase tracking-wide">{activeWorkspace?.name || 'Workspace'}</span>
                        </div>
                        <div className="ml-2 pl-2 border-l border-gray-200 space-y-1">
                            {websites.map(site => (
                                <div
                                    key={site.id}
                                    onClick={() => handleOpenTab(`preview:${site.id}`, site.name, 'preview')}
                                    className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-xs select-none group transition-colors
                                    ${activeTab === `preview:${site.id}` ? 'bg-[var(--ide-selection)] text-[var(--ide-selection-text)] font-medium border border-blue-100' : 'hover:bg-[var(--ide-hover)] text-gray-600'}`}
                                >
                                    <Globe size={14} className={activeTab === `preview:${site.id}` ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} />
                                    <span className="truncate">{site.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 px-2">
                            <button onClick={() => setTerminalVisible(!terminalVisible)} className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded mb-2 border border-gray-200 transition-colors">Toggle Terminal</button>
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-800 uppercase mb-1">Status</p>
                                <div className="flex items-center gap-2 text-xs text-blue-700">
                                    <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                                    <span>Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Main Content (Center) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--ide-bg)] relative z-0">

                {/* Tabs */}
                <div className="flex ide-header overflow-x-auto hide-scrollbar h-10 items-end px-2 gap-1 z-20 sticky top-0 bg-[var(--ide-header)]">
                    {openTabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-xs cursor-pointer flex items-center gap-2 rounded-t-lg min-w-[120px] max-w-[200px] select-none transition-all duration-200 border-t border-l border-r
                            ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 font-bold border-gray-300 border-b-white relative top-px z-30 shadow-sm'
                                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}
                        >
                            <span className="truncate flex-1">{tab.title}</span>
                            <X size={14} className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 rounded p-0.5 transition-all" onClick={(e) => {
                                e.stopPropagation();
                                const newTabs = openTabs.filter(t => t.id !== tab.id);
                                setOpenTabs(newTabs);
                                if (activeTab === tab.id) {
                                    setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : 'welcome');
                                }
                            }} />
                        </div>
                    ))}
                </div>

                {/* Editor / Preview Area */}
                <div className="flex-1 bg-white relative overflow-hidden flex flex-col z-10 shadow-sm m-2 rounded-lg border border-[var(--ide-border)]">
                    {activeTab === 'welcome' && (
                        <div className="h-full overflow-y-auto bg-[var(--ide-bg)] p-6">
                            <h1 className="text-3xl font-light text-gray-800 mb-2">My Projects</h1>
                            <p className="text-gray-500 mb-8">Select a project to edit or create a new node.</p>

                            <div className="container-custom">
                                {/* Create New Card */}
                                <div onClick={() => runCommand('build New Project')} className="card border-2 border-dashed border-blue-200 hover:border-blue-500 flex flex-col items-center justify-center bg-blue-50/50 group">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                                        <Plus size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-blue-800">New Project</h3>
                                    <p className="text-sm text-blue-400 text-center mt-2">Launch a new node</p>
                                </div>

                                {/* Existing Projects */}
                                {websites.map(site => (
                                    <div key={site.id} onClick={() => handleOpenTab(`preview:${site.id}`, site.name, 'preview')} className="card group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-xs bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white px-2 py-1 rounded">Delete</button>
                                        </div>
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Globe size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{site.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4 truncate">{site.domain}</p>
                                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${site.status === 'Building' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{site.status || 'Live'}</span>
                                            <button className="btn-primary text-xs py-1 px-3">Open</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {openTabs.find(t => t.id === activeTab)?.type === 'preview' && (
                        <div className="flex-1 flex flex-col relative h-full">
                            <iframe
                                src={`${process.env.NEXT_PUBLIC_PREVIEW_URL || 'http://localhost:3001'}/?id=${activeTab.split(':')[1]}`}
                                className="w-full h-full border-none bg-white"
                                title="Preview"
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Terminal */}
                {terminalVisible && (
                    <TerminalComponent
                        lines={terminalLines}
                        onCommand={runCommand}
                        height={terminalHeight}
                        problems={problems}
                        onFixProblem={handleFixProblem}
                        onClose={() => setTerminalVisible(false)}
                    />
                )}
            </div>

            {/* 3. Helper Agent (Right) */}
            {rightPanelVisible && (
                <div className="w-80 bg-white border-l border-[var(--ide-border)] flex flex-col shrink-0 shadow-2xl z-50 relative">
                    <div className="h-10 px-4 flex items-center justify-between ide-header bg-gray-50">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2"><MessageSquare size={14} /> Velocity Assistant</span>
                        <div className="flex items-center gap-2">
                            <div
                                onClick={() => setIsSwarmMode(!isSwarmMode)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all border ${isSwarmMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'}`}
                                title="Toggle Swarm Intelligence (Multi-Agent)"
                            >
                                <Zap size={12} fill={isSwarmMode ? 'currentColor' : 'none'} />
                                <span className="text-[10px] font-black uppercase">Swarm</span>
                            </div>
                            <X size={16} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setRightPanelVisible(false)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start text-left'}`}>
                                <div className={`max-w-[90%] px-4 py-3 rounded-xl text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
                            className="relative flex items-center"
                        >
                            <input
                                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-gray-800 shadow-sm"
                                placeholder="Build a landing page..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                            <button type="submit" aria-label="Send Message" title="Send Message" className="absolute right-2 text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
