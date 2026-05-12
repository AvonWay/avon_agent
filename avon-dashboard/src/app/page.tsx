"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchSites, generateSite, login, fetchWorkspaces, sendChat,
    switchWorkspace, fetchMembers, fetchActivity, deleteSite, checkConfig, updateConfig,
    executeCommand, listFiles, readFile, writeFile, publishFile
} from '@/lib/api';
import {
    Files, Search, GitGraph, Play, Settings, MoreHorizontal, X,
    ChevronRight, ChevronDown, Terminal, Globe, Plus, Cpu, Shield,
    Sun, Moon, Box, Activity, User, Zap, Code, Send, RefreshCw, Folder, File, MessageSquare, Rocket, ExternalLink, TrendingUp
} from 'lucide-react';
import ProfileSettings from '@/components/ProfileSettings';
import EngineConfig from '@/components/EngineConfig';
import TopNav from '@/components/TopNav';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'jsx') return 'javascript';
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'html') return 'html';
    if (ext === 'css') return 'css';
    if (ext === 'json') return 'json';
    if (ext === 'md') return 'markdown';
    return 'text';
};

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
    const [terminalVisible, setTerminalVisible] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(250);
    const [rightPanelVisible, setRightPanelVisible] = useState(false);

    // Data
    const [terminalLines, setTerminalLines] = useState<string[]>(['Velocity Shell v2.1 (Light Blue Theme)', 'Type "help" to start.']);
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isBuilding, setIsBuilding] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [isSwarmMode, setIsSwarmMode] = useState(true);
    const [explorerMode, setExplorerMode] = useState<'nodes' | 'files'>('nodes');
    const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
    const [fileContents, setFileContents] = useState<Record<string, string>>({});
    const [editedContents, setEditedContents] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    const [previewHtml, setPreviewHtml] = useState<Record<string, string>>({});

    // Model Selection
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [availableModels] = useState([
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'frontier' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'frontier' },
        { id: 'gpt-4o', name: 'GPT-4o', type: 'frontier' },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', type: 'frontier' },
        { id: 'llama3', name: 'Llama 3 (Local)', type: 'local' },
        { id: 'phi4', name: 'Phi-4 (Local)', type: 'local' },
    ]);

    useEffect(() => { initIDE(); }, []);

    const initIDE = async () => {
        try {
            const auth = await login('avon_admin', 'explorer');
            setAuthToken(auth.token);
            const [sites, ws] = await Promise.all([
                fetchSites(auth.token).catch(() => []),
                fetchWorkspaces(auth.token).catch(() => [])
            ]);
            setWebsites(Array.isArray(sites) ? sites.map((s: any) => ({
                id: s.id,
                name: s.site_name || s.name,
                domain: s.domain || '',
                status: s.status === 'active' ? 'Live' : s.status === 'pending' ? 'Building' : s.status
            })) : []);
            setWorkspaces(Array.isArray(ws) ? ws : []);
            setActiveWorkspace(ws?.[0] || null);
            setLoading(false);
            printTerminal("✅ System Ready. Connected to Supabase. Swarm Mode: ACTIVE.");
            printTerminal("💡 Tip: Send !avon <task> via WhatsApp to trigger a build.");
            loadFiles(auth.token);
        } catch (e) {
            console.error("Boot Failure", e);
            setLoading(false);
            printTerminal("⚠️ Could not connect to backend. Make sure 'node server.js' is running in avon-backend.");
        }
    };

    const loadFiles = async (token: string, path = '.') => {
        try {
            const files = await listFiles(token, path);
            setWorkspaceFiles(files);
        } catch (e) {
            console.error("File Load Error", e);
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
            printTerminal("🤖 [ARCHITECT] Analyzing request and synthesizing digital DNA...");
            await new Promise(r => setTimeout(r, 1200));
            printTerminal("📐 [ENGINEER] Optimizing technical design patterns...");
            await new Promise(r => setTimeout(r, 800));
            printTerminal("👷 [BUILDER] Executing high-density component synthesis...");
            await new Promise(r => setTimeout(r, 1500));
            printTerminal("🧬 [SYNTHESIZER] Weaving architectural master-file...");
            await new Promise(r => setTimeout(r, 1200));
            printTerminal("🛡️ [GUARDIAN] Performing security and brand fidelity audit...");
        }

        try {
            // FIRE LOCAL VELOCITY CLI SWARM
            const response = await fetch('/api/velocity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: prompt })
            });
            const res = await response.json();

            if (res.status === 'success') {
                printTerminal(`Build Initiated: Swarm PID #${res.pid}`);
                setChatMessages(prev => [...prev, { role: 'velocity', content: `Swarm deployed! I am actively building "${prompt}". Check the terminal or Artifacts panel to watch my progress live.` }]);

                const siteId = `swarm_${res.pid}`;
                // Replace temp site with real site info in websites list
                setWebsites(prev => prev.map(s => s.id === tempId ? { ...s, id: siteId, status: 'Compiling' } : s));
                setOpenTabs(prev => prev.map(t => t.id === `preview:${tempId}` ? { ...t, id: `preview:${siteId}`, title: tempName } : t));
                setActiveTab(prev => prev === `preview:${tempId}` ? `preview:${siteId}` : prev);

                // Poll for build completion and auto-load preview
                const pollForBuild = async (attempt = 0) => {
                    if (attempt > 20) {
                        printTerminal(`⏳ Build taking longer than expected. Check terminal for status.`);
                        return;
                    }
                    try {
                        const buildsRes = await fetch(`http://localhost:4000/api/preview`, {
                            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                        });
                        const builds = await buildsRes.json();
                        if (Array.isArray(builds) && builds.length > 0) {
                            // Find the most recent build
                            const latestBuild = builds[builds.length - 1];
                            const previewUrl = `http://localhost:4000${latestBuild.previewUrl}`;
                            setPreviewUrls(prev => ({ ...prev, [`preview:${siteId}`]: previewUrl }));
                            setWebsites(prev => prev.map(s => s.id === siteId ? { ...s, status: 'Live', domain: latestBuild.name } : s));
                            printTerminal(`✅ Build Complete! Preview loaded for: ${latestBuild.name}`);
                            if (authToken) loadFiles(authToken);
                            return;
                        }
                    } catch { /* retry */ }
                    setTimeout(() => pollForBuild(attempt + 1), 10000);
                };
                pollForBuild();
            } else {
                 throw new Error(res.error || "Unknown Swarm Error");
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
            try {
                setChatMessages(prev => [...prev, { role: 'velocity', content: '...' }]); // Loading state
                const res = await sendChat([{ role: 'user', content: msg }], selectedModel);
                const aiText = res.content || res.response || (res.message && res.message.content) || (res.choices && res.choices[0] && res.choices[0].message.content) || JSON.stringify(res);
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'velocity', content: aiText };
                    return newMessages;
                });
            } catch (err: any) {
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'velocity', content: `⚠️ Connection Error: Unable to reach Velocity Cortex. (${err.message})` };
                    return newMessages;
                });
            }
        }
    };

    const handleOpenTab = async (id: string, title: string, type: 'page' | 'preview' | 'file') => {
        if (!openTabs.find(t => t.id === id)) {
            setOpenTabs([...openTabs, { id, title, type }]);
        }
        setActiveTab(id);

        if (type === 'file' && authToken && !fileContents[id]) {
            try {
                const res = await readFile(authToken, id);
                setFileContents(prev => ({ ...prev, [id]: res.content || '' }));
                setEditedContents(prev => ({ ...prev, [id]: res.content || '' }));
            } catch (e) {
                console.error("Failed to read file", e);
                setFileContents(prev => ({ ...prev, [id]: `Error: Could not read file ${id}` }));
            }
        }
    };

    const handleSave = async () => {
        if (!authToken || !activeTab || !editedContents[activeTab]) return;
        const type = openTabs.find(t => t.id === activeTab)?.type;
        if (type !== 'file') return;

        setIsSaving(true);
        try {
            await writeFile(authToken, activeTab, editedContents[activeTab]);
            setFileContents(prev => ({ ...prev, [activeTab]: editedContents[activeTab] }));
            printTerminal(`💾 Saved: ${activeTab}`);
        } catch (e) {
            console.error("Save Error", e);
            printTerminal(`❌ Save Failed: ${activeTab}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!authToken || !activeTab) return;
        const type = openTabs.find(t => t.id === activeTab)?.type;
        if (type !== 'file') return;

        setIsPublishing(true);
        printTerminal(`🚀 Publishing: ${activeTab}...`);
        try {
            const res = await publishFile(authToken, activeTab);
            if (res.success) {
                printTerminal(`✅ Success! Site LIVE at: ${res.url}`);
                setChatMessages(prev => [...prev, {
                    role: 'velocity',
                    content: `I've successfully published your site! You can view it live here: [${res.url}](${res.url})`
                }]);
                // Automatically open the live URL in a new window
                window.open(res.url, '_blank');
            } else {
                printTerminal(`❌ Publish Failed: ${res.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error("Publish Error", e);
            printTerminal(`❌ Internal Error: ${e.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [authToken, activeTab, editedContents]);

    return (
        <div className="flex h-screen w-screen bg-[var(--ide-bg)] text-[var(--ide-fg)] overflow-hidden font-sans">

            {/* 1. Side Bar (Project Explorer) */}
            {sidebarVisible && (
                <div className="w-56 bg-[var(--ide-sidebar)] border-r border-[var(--ide-border)] flex flex-col shrink-0 z-30 shadow-sm">
                    <div className="h-10 px-4 flex items-center justify-between ide-header mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ide-fg)]">Explorer</span>
                        <MoreHorizontal size={16} className="cursor-pointer text-gray-400 hover:text-blue-500" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-1">
                        <div className="flex items-center justify-between gap-1 px-2 py-1 font-bold text-[10px] text-[var(--ide-fg)] cursor-pointer hover:bg-[var(--ide-hover)] rounded uppercase tracking-wider opacity-60">
                            <span>{explorerMode === 'nodes' ? 'Project Nodes' : 'Workspace Files'}</span>
                            <div className="flex bg-gray-100 rounded p-0.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setExplorerMode('nodes')}
                                    className={`px-1.5 py-0.5 rounded ${explorerMode === 'nodes' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    NODES
                                </button>
                                <button
                                    onClick={() => {
                                        setExplorerMode('files');
                                        if (authToken) loadFiles(authToken);
                                    }}
                                    className={`px-1.5 py-0.5 rounded ${explorerMode === 'files' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    FILES
                                </button>
                            </div>
                        </div>

                        <div className="ml-2 pl-2 border-l border-gray-200 mt-2 space-y-1">
                            {explorerMode === 'nodes' ? (
                                websites.map(site => (
                                    <div
                                        key={site.id}
                                        onClick={() => handleOpenTab(`preview:${site.id}`, site.name, 'preview')}
                                        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-xs select-none group transition-colors
                                        ${activeTab === `preview:${site.id}` ? 'bg-[var(--ide-selection)] text-[var(--ide-selection-text)] font-medium border border-blue-100' : 'hover:bg-[var(--ide-hover)] text-gray-600'}`}
                                    >
                                        <Globe size={14} className={activeTab === `preview:${site.id}` ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} />
                                        <span className="truncate">{site.name}</span>
                                    </div>
                                ))
                            ) : (
                                workspaceFiles.map(file => (
                                    <div
                                        key={file.path}
                                        onClick={() => !file.isDirectory && handleOpenTab(file.path, file.name, 'file')}
                                        className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded text-xs select-none group transition-colors
                                        ${activeTab === file.path ? 'bg-[var(--ide-selection)] text-[var(--ide-selection-text)] font-medium' : 'hover:bg-[var(--ide-hover)] text-gray-600'}`}
                                    >
                                        {file.isDirectory ? <Folder size={14} className="text-blue-400" /> : <File size={14} className="text-gray-400" />}
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 px-2">
                            <button onClick={() => setTerminalVisible(!terminalVisible)} className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded mb-2 border border-gray-200 transition-colors">Toggle Terminal</button>
                            <button onClick={() => handleOpenTab('engine', 'AI Engine', 'page')} className="w-full text-left text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 px-3 py-2 rounded mb-2 border border-blue-200 transition-colors flex items-center gap-2 font-medium">
                                <Cpu size={14} />
                                AI Engine
                            </button>
                            <button onClick={() => handleOpenTab('trade', 'Velocity Trade', 'page')} className="w-full text-left text-xs bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 text-green-700 px-3 py-2 rounded mb-2 border border-green-200 transition-colors flex items-center justify-between font-medium group">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={14} />
                                    Velocity Trade
                                </div>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </button>
                            <button onClick={() => handleOpenTab('opencode', 'OpenCode', 'page')} className="w-full text-left text-xs bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 px-3 py-2 rounded mb-2 border border-amber-200 transition-colors flex items-center justify-between font-medium group">
                                <div className="flex items-center gap-2">
                                    <Code size={14} />
                                    OpenCode
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">LOCAL</span>
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                </div>
                            </button>
                            <button onClick={() => handleOpenTab('blueprints', 'Blueprints', 'page')} className="w-full text-left text-xs bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 px-3 py-2 rounded mb-2 border border-purple-200 transition-colors flex items-center gap-2 font-medium">
                                <Box size={14} />
                                Blueprints
                            </button>
                            <button onClick={() => handleOpenTab('settings', 'Settings', 'page')} className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded mb-2 border border-gray-200 transition-colors flex items-center gap-2">
                                <Settings size={14} />
                                Settings
                            </button>
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
                <TopNav />

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
                            {tab.type === 'file' && editedContents[tab.id] !== fileContents[tab.id] && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Unsaved changes" />
                            )}
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

                            {/* What's New Banner */}
                            <div className="mb-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">New Update</span>
                                        <span className="text-blue-100 text-xs font-medium">Velocity v2.5 is here</span>
                                    </div>
                                    <h2 className="text-3xl font-black mb-4 tracking-tight">The Agnostic AI Engine is Live.</h2>
                                    <p className="text-blue-100/80 text-sm mb-6 max-w-2xl font-medium">
                                        Velocity is now fully model-agnostic. Connect your local Ollama instance, link your OpenAI/Gemini keys, or use our industrial frontier swarm. Own your compute, own your intelligence.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                        <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-900 shadow-lg shrink-0">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Velocity Trade</h4>
                                                <p className="text-xs text-blue-100 mt-1 opacity-80">AI-powered Pine Script & TradingView MCP.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                            <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center text-green-900 shadow-lg shrink-0">
                                                <Cpu size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Agnostic Engine</h4>
                                                <p className="text-xs text-blue-100 mt-1 opacity-80">Switch between Gemini, OpenAI, and Ollama.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                            <div className="w-10 h-10 bg-rose-400 rounded-xl flex items-center justify-center text-rose-900 shadow-lg shrink-0">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Evolution Loop</h4>
                                                <p className="text-xs text-blue-100 mt-1 opacity-80">Autonomous self-patching & monitoring.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                            <div className="w-10 h-10 bg-purple-400 rounded-xl flex items-center justify-center text-purple-900 shadow-lg shrink-0">
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Music Blueprints</h4>
                                                <p className="text-xs text-blue-100 mt-1 opacity-80">High-fidelity designs for artists & labels.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative Glows */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full blur-[100px] opacity-20 -ml-32 -mb-32"></div>
                            </div>

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

                    {activeTab === 'settings' && (
                        <div className="h-full overflow-y-auto bg-white">
                            <ProfileSettings />
                        </div>
                    )}

                    {activeTab === 'engine' && (
                        <div className="h-full overflow-y-auto">
                            <EngineConfig />
                        </div>
                    )}

                    {activeTab === 'trade' && (
                        <div className="h-full overflow-y-auto p-8 bg-gray-50">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Velocity Trade</h1>
                                        <p className="text-gray-500">Autonomous TradingView Intelligence Swarm</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Core Orchestrator</h3>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                <span className="text-sm font-medium text-gray-700">Trading Agent v3</span>
                                            </div>
                                            <button 
                                                onClick={() => runCommand('npm run trade')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                            >
                                                START AGENT
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            The Velocity Trade agent connects to your TradingView Desktop instance via MCP to execute strategies and perform real-time market analysis.
                                        </p>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Active Strategies</h3>
                                        <div className="space-y-2">
                                            {['Momentum', 'Crypto SuperTrend', 'Forex Mean Reversion', 'Mutual Fund Golden Cross', 'Volatility Squeeze'].map(s => (
                                                <div key={s} className="flex items-center gap-2 text-xs text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                                            <Terminal size={14} />
                                            <span>TRADING_AGENT_OUTPUT</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs text-gray-300 space-y-1 h-64 overflow-y-auto custom-scrollbar opacity-80">
                                        <div>[SYSTEM] Velocity Trade Swarm initializing...</div>
                                        <div>[MCP] Connecting to TradingView Desktop (CDP: 9222)...</div>
                                        <div>[LLM] Ollama (Llama-3) standby.</div>
                                        <div className="text-gray-500 italic">Click "START AGENT" to begin live execution.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'opencode' && (
                        <div className="h-full overflow-y-auto p-8 bg-slate-50">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-lg shadow-amber-200">
                                            <Code size={32} />
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">OpenCode</h1>
                                            <p className="text-slate-500 font-medium">Autonomous Terminal Agent — Local Swarm Intelligence</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-amber-200 uppercase tracking-widest">Deploy Local Node</button>
                                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">Logs</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Agent Health</h3>
                                            <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-lg uppercase">Optimal</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Local Model</span>
                                                <span className="text-slate-900 font-bold">Qwen 2.5 Coder (7B)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Latency</span>
                                                <span className="text-slate-900 font-bold">12ms (Ollama)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Memory Usage</span>
                                                <span className="text-slate-900 font-bold">4.7 GB VRAM</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Core Orchestrator</h3>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                    <Cpu size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 tracking-tight">Coding Agent v1.2</div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-wider">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Connected
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            OpenCode performs autonomous file-system operations and shell execution locally without external data leakage.
                                        </p>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Autonomous Stats</h3>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Files Refactored', val: '42' },
                                                { label: 'Shell Commands', val: '189' },
                                                { label: 'Context Length', val: '128k' }
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-slate-500 font-medium">{s.label}</span>
                                                    <span className="text-slate-900 font-black">{s.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-amber-400 text-xs font-bold uppercase tracking-widest">
                                            <Terminal size={16} />
                                            <span>OpenCode_Terminal_Feed</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs text-slate-300 space-y-2 h-80 overflow-y-auto custom-scrollbar leading-relaxed">
                                        <div className="flex gap-2"><span className="text-amber-500/50">[BOOT]</span> <span>Velocity OpenCode Agent v1.2.0 initialized.</span></div>
                                        <div className="flex gap-2"><span className="text-amber-500/50">[LLM]</span> <span>Connected to Ollama: qwen2.5-coder:7b</span></div>
                                        <div className="flex gap-2"><span className="text-amber-500/50">[FS]</span> <span>Context mapped: 147 files in /avon-dashboard</span></div>
                                        <div className="flex gap-2"><span className="text-amber-500/50">[SWARM]</span> <span>Registered as 'coder' in Supervisor profileMap.</span></div>
                                        <div className="flex gap-2"><span className="text-green-500/50">[READY]</span> <span className="animate-pulse">OpenCode active. Executing storefront mission...</span></div>
                                        <div className="mt-4 text-slate-500 italic border-t border-slate-800 pt-4">Currently building: High-fidelity storefront components.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'blueprints' && (
                        <div className="h-full overflow-y-auto p-8 bg-slate-50">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Blueprints</h1>
                                        <p className="text-slate-500">High-fidelity industry-specific architectural patterns</p>
                                    </div>
                                    <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-widest border border-purple-200">Pro Feature</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all group cursor-pointer" onClick={() => handleOpenTab('preview:music', 'Music Blueprint', 'preview')}>
                                        <div className="h-48 bg-slate-200 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                                            <img src="assets/images/img_014.jpg" alt="Music" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute bottom-4 left-4 z-20">
                                                <span className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded uppercase">Featured</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg text-slate-800 mb-2">Music & Label Hub</h3>
                                            <p className="text-sm text-slate-500 mb-4">Optimized for artist releases, tour management, and rich media delivery.</p>
                                            <button className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-purple-600 transition-colors">LAUNCH BLUEPRINT</button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                                        <div className="h-48 bg-slate-100 flex items-center justify-center">
                                            <Globe size={48} className="text-slate-300" />
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg text-slate-800 mb-2">SaaS Enterprise</h3>
                                            <p className="text-sm text-slate-500 mb-4">Complex multi-page application with auth and billing pre-integrated.</p>
                                            <button className="w-full py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed">COMING SOON</button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                                        <div className="h-48 bg-slate-100 flex items-center justify-center">
                                            <Zap size={48} className="text-slate-300" />
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg text-slate-800 mb-2">Web3 Dashboard</h3>
                                            <p className="text-sm text-slate-500 mb-4">Real-time crypto metrics and wallet integration components.</p>
                                            <button className="w-full py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed">COMING SOON</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {openTabs.find(t => t.id === activeTab)?.type === 'preview' && (
                        <div className="flex-1 flex flex-col relative h-full">
                            {previewUrls[activeTab] ? (
                                <iframe
                                    src={previewUrls[activeTab]}
                                    className="w-full h-full border-none bg-white"
                                    title="Site Preview"
                                    sandbox="allow-scripts allow-same-origin allow-popups"
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 text-gray-500">
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">Building Your Site...</h3>
                                    <p className="text-sm text-gray-400 max-w-md text-center">The Velocity Swarm is constructing your site. Watch the terminal below for real-time progress updates.</p>
                                    <div className="mt-6 flex items-center gap-2 text-xs text-blue-600 font-mono">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        <span>Multi-Agent Pipeline Active</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {openTabs.find(t => t.id === activeTab)?.type === 'file' && (
                        <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-white text-gray-800 font-mono text-xs">
                            {/* Editor Toolbar */}
                            <div className="h-8 px-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <File size={10} />
                                    {activeTab}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || editedContents[activeTab] === fileContents[activeTab]}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition-all
                                        ${editedContents[activeTab] !== fileContents[activeTab]
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <RefreshCw size={10} className={isSaving ? 'animate-spin' : ''} />
                                        {isSaving ? 'SAVING...' : 'SAVE'}
                                    </button>
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition-all bg-green-600 text-white hover:bg-green-700 shadow-sm
                                        ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Rocket size={10} className={isPublishing ? 'animate-bounce' : ''} />
                                        {isPublishing ? 'PUBLISHING...' : 'PUBLISH'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 relative h-full overflow-hidden">
                                {/* Invisible Textarea for Editing */}
                                <textarea
                                    id="code-editor"
                                    title="Code Editor"
                                    aria-label="Code Editor"
                                    className="absolute inset-0 w-full h-full p-[24px] bg-transparent text-transparent caret-blue-600 outline-none resize-none z-20 font-mono text-[13px] leading-[1.6] whitespace-pre [word-wrap:normal] [tab-size:4]"
                                    value={editedContents[activeTab] || ''}
                                    onChange={(e) => setEditedContents(prev => ({ ...prev, [activeTab]: e.target.value }))}
                                    onScroll={(e: any) => {
                                        const sync = document.getElementById('highlight-sync');
                                        if (sync) {
                                            sync.scrollTop = e.target.scrollTop;
                                            sync.scrollLeft = e.target.scrollLeft;
                                        }
                                    }}
                                    spellCheck={false}
                                />
                                {/* Syntax Highlighting for Display */}
                                <div id="highlight-sync" className="absolute inset-0 z-10 pointer-events-none overflow-hidden h-full">
                                    <SyntaxHighlighter
                                        language={getLanguage(activeTab)}
                                        style={oneLight}
                                        customStyle={{
                                            margin: 0,
                                            padding: '24px',
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            background: 'white',
                                            minHeight: '100%',
                                            width: 'max-content',
                                            minWidth: '100%',
                                        }}
                                        codeTagProps={{
                                            style: {
                                                fontFamily: 'inherit'
                                            }
                                        }}
                                    >
                                        {editedContents[activeTab] || ''}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
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
                    <div className="h-10 px-4 flex items-center justify-between ide-header bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-blue-600" />
                            <div className="relative">
                                <button 
                                    onClick={() => setModelMenuOpen(!modelMenuOpen)}
                                    className="text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                                >
                                    {availableModels.find(m => m.id === selectedModel)?.name || 'Velocity Assistant'}
                                    <ChevronDown size={12} className={`transition-transform ${modelMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {modelMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] overflow-hidden py-1">
                                        <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">Frontier Models</div>
                                        {availableModels.filter(m => m.type === 'frontier').map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setSelectedModel(model.id);
                                                    setModelMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-blue-50 flex items-center justify-between ${selectedModel === model.id ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-600'}`}
                                            >
                                                {model.name}
                                                {selectedModel === model.id && <Zap size={10} fill="currentColor" />}
                                            </button>
                                        ))}
                                        <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-y border-gray-100">Local Engines</div>
                                        {availableModels.filter(m => m.type === 'local').map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setSelectedModel(model.id);
                                                    setModelMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-amber-50 flex items-center justify-between ${selectedModel === model.id ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-gray-600'}`}
                                            >
                                                {model.name}
                                                {selectedModel === model.id && <Cpu size={10} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
