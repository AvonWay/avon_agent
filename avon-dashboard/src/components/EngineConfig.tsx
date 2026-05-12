"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    fetchEngineStatus, probeEngine, configureEngine,
    registerProvider, switchEngine
} from '@/lib/api';
import {
    Cpu, Wifi, WifiOff, Zap, Shield, Globe, Server,
    RefreshCw, ChevronDown, Plus, Trash2, Activity,
    ArrowRight, Check, AlertTriangle, Settings
} from 'lucide-react';

interface Provider {
    id: string;
    type: 'local' | 'frontier' | 'custom';
    name: string;
    endpoint?: string;
    models: string[];
    status: string;
    contextWindow?: number;
    capabilities?: Record<string, any>;
}

interface ProbeResult {
    status: string;
    models?: { name: string; size?: number }[];
    error?: string;
}

const TASK_ROUTING_OPTIONS = [
    { key: 'architecture', label: 'System Architecture', icon: '🏗️', tier: 'high' },
    { key: 'code_generation', label: 'Code Generation', icon: '⚡', tier: 'medium' },
    { key: 'unit_testing', label: 'Unit Testing', icon: '🧪', tier: 'low' },
    { key: 'documentation', label: 'Documentation', icon: '📝', tier: 'low' },
    { key: 'security_audit', label: 'Security Audit', icon: '🛡️', tier: 'high' },
    { key: 'code_review', label: 'Code Review', icon: '🔍', tier: 'medium' },
    { key: 'ui_generation', label: 'UI Generation', icon: '🎨', tier: 'medium' },
    { key: 'debugging', label: 'Debugging', icon: '🐛', tier: 'high' },
];

export default function EngineConfig() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [ollamaProbe, setOllamaProbe] = useState<ProbeResult | null>(null);
    const [probing, setProbing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeEngine, setActiveEngine] = useState({ provider: '', model: '' });
    const [taskRouting, setTaskRouting] = useState<Record<string, string>>({});
    const [customEndpoint, setCustomEndpoint] = useState({ name: '', endpoint: '', apiKey: '' });
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [engineLog, setEngineLog] = useState<string[]>([]);
    const [sessionCount, setSessionCount] = useState(0);

    const token = typeof window !== 'undefined' ? localStorage.getItem('velocity_token') : null;

    const log = useCallback((msg: string) => {
        setEngineLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    }, []);

    const loadStatus = useCallback(async () => {
        try {
            const status = await fetchEngineStatus();
            setProviders(status.providers || []);
            setSessionCount(status.activeSessions || 0);
            log(`Engine status loaded — ${(status.providers || []).length} providers registered`);
        } catch (err: any) {
            log(`⚠️ Failed to load engine status: ${err.message}`);
        }
    }, [log]);

    const runProbe = useCallback(async () => {
        setProbing(true);
        log('🔍 Probing all providers...');
        try {
            const health = await probeEngine();
            setOllamaProbe(health.ollama || null);
            // Update provider statuses from probe
            setProviders(prev => prev.map(p => ({
                ...p,
                status: health[p.id]?.status || p.status,
                models: health[p.id]?.models?.map((m: any) => m.name || m) || p.models
            })));
            const ollamaStatus = health.ollama?.status || 'offline';
            const modelCount = health.ollama?.models?.length || 0;
            log(`✅ Probe complete — Ollama: ${ollamaStatus} (${modelCount} models)`);
        } catch (err: any) {
            log(`❌ Probe failed: ${err.message}`);
        } finally {
            setProbing(false);
        }
    }, [log]);

    useEffect(() => {
        loadStatus();
        runProbe();
    }, [loadStatus, runProbe]);

    const handleSaveConfig = async () => {
        if (!token) { log('⚠️ No auth token — please log in first'); return; }
        setSaving(true);
        try {
            await configureEngine(token, {
                defaultProvider: activeEngine.provider,
                defaultModel: activeEngine.model,
                taskRouting,
            });
            log('✅ Engine configuration saved');
        } catch (err: any) {
            log(`❌ Save failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAddCustom = async () => {
        if (!token || !customEndpoint.endpoint) return;
        try {
            await registerProvider(token, {
                name: customEndpoint.name || 'Custom Engine',
                endpoint: customEndpoint.endpoint,
                apiKey: customEndpoint.apiKey || undefined,
            });
            log(`✅ Custom provider registered: ${customEndpoint.name || customEndpoint.endpoint}`);
            setShowCustomForm(false);
            setCustomEndpoint({ name: '', endpoint: '', apiKey: '' });
            loadStatus();
        } catch (err: any) {
            log(`❌ Registration failed: ${err.message}`);
        }
    };

    const handleSwitchEngine = async (provider: string, model: string) => {
        if (!token) return;
        setActiveEngine({ provider, model });
        try {
            const result = await switchEngine(token, `session_ui_${Date.now()}`, provider, model);
            log(`🔄 Engine switched → ${model} (${provider})${result.contextCompressed ? ' [context compressed]' : ''}`);
        } catch (err: any) {
            log(`⚠️ Switch note: ${err.message}`);
        }
    };

    const getProviderIcon = (type: string) => {
        switch (type) {
            case 'local': return <Server size={16} className="text-emerald-500" />;
            case 'frontier': return <Globe size={16} className="text-blue-500" />;
            case 'custom': return <Cpu size={16} className="text-purple-500" />;
            default: return <Cpu size={16} />;
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            offline: 'bg-red-100 text-red-700 border-red-200',
            unknown: 'bg-gray-100 text-gray-500 border-gray-200',
        };
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${colors[status] || colors.unknown}`}>
                {status === 'online' ? <><Wifi size={10} className="inline mr-1" />{status}</> : status}
            </span>
        );
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Cpu size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Velocity Engine</h1>
                        <p className="text-sm text-gray-500">Provider-Agnostic AI Orchestration — Bring Your Own Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Activity size={12} />
                        <span>{sessionCount} active session{sessionCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Server size={12} />
                        <span>{providers.length} provider{providers.length !== 1 ? 's' : ''} registered</span>
                    </div>
                    <button
                        onClick={runProbe}
                        disabled={probing}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all shadow-sm"
                    >
                        <RefreshCw size={12} className={probing ? 'animate-spin' : ''} />
                        {probing ? 'Probing...' : 'Refresh Status'}
                    </button>
                </div>
            </div>

            <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Provider Cards ── */}
                <div className="lg:col-span-2">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Shield size={14} /> Registered Providers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {providers.map(p => (
                            <div key={p.id} className={`bg-white rounded-xl border p-5 transition-all hover:shadow-md ${activeEngine.provider === p.id ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-gray-200 hover:border-blue-200'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {getProviderIcon(p.type)}
                                        <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                                    </div>
                                    {getStatusBadge(p.status)}
                                </div>
                                <div className="text-xs text-gray-400 mb-3 font-mono truncate">{p.endpoint || 'N/A'}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        {p.models.length} model{p.models.length !== 1 ? 's' : ''}
                                        {p.contextWindow ? ` · ${(p.contextWindow / 1000).toFixed(0)}K ctx` : ''}
                                    </div>
                                    {p.type === 'local' && p.capabilities?.costPerToken === 0 && (
                                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold border border-emerald-100">FREE</span>
                                    )}
                                    {p.type === 'frontier' && (
                                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold border border-blue-100">API</span>
                                    )}
                                </div>
                                {/* Model selector */}
                                {p.models.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <select
                                            title={`Select model for ${p.name}`}
                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 cursor-pointer"
                                            value={activeEngine.provider === p.id ? activeEngine.model : ''}
                                            onChange={e => handleSwitchEngine(p.id, e.target.value)}
                                        >
                                            <option value="">Select a model...</option>
                                            {p.models.map(m => (
                                                <option key={typeof m === 'string' ? m : m} value={typeof m === 'string' ? m : m}>{typeof m === 'string' ? m : m}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {activeEngine.provider === p.id && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                        <Check size={10} /> ACTIVE ENGINE
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Custom Provider Card */}
                        <div
                            onClick={() => setShowCustomForm(!showCustomForm)}
                            className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group min-h-[160px]"
                        >
                            <Plus size={24} className="text-gray-300 group-hover:text-blue-500 transition-colors mb-2" />
                            <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600">Add Custom Engine</span>
                            <span className="text-[10px] text-gray-300 mt-1">OpenAI-compatible endpoint</span>
                        </div>
                    </div>
                </div>

                {/* ── Custom Endpoint Form ── */}
                {showCustomForm && (
                    <div className="lg:col-span-2 bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Plus size={14} /> Register Custom Engine (OpenAI-Compatible)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Name</label>
                                <input
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                                    placeholder="My LM Studio"
                                    value={customEndpoint.name}
                                    onChange={e => setCustomEndpoint(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Endpoint URL</label>
                                <input
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 font-mono"
                                    placeholder="http://localhost:1234/v1"
                                    value={customEndpoint.endpoint}
                                    onChange={e => setCustomEndpoint(p => ({ ...p, endpoint: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">API Key (optional)</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                                    placeholder="sk-..."
                                    value={customEndpoint.apiKey}
                                    onChange={e => setCustomEndpoint(p => ({ ...p, apiKey: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowCustomForm(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                            <button
                                onClick={handleAddCustom}
                                disabled={!customEndpoint.endpoint}
                                className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-bold shadow-sm"
                            >
                                Register Provider
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Task Routing ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap size={14} /> Task Routing
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">Assign each task type to a specific engine tier for cost optimization.</p>
                    <div className="space-y-3">
                        {TASK_ROUTING_OPTIONS.map(task => (
                            <div key={task.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{task.icon}</span>
                                    <span className="text-xs font-medium text-gray-700">{task.label}</span>
                                </div>
                                <select
                                    title={`Route ${task.label}`}
                                    className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 cursor-pointer min-w-[140px]"
                                    value={taskRouting[task.key] || task.tier}
                                    onChange={e => setTaskRouting(p => ({ ...p, [task.key]: e.target.value }))}
                                >
                                    <option value="high">🧠 Frontier (Pro)</option>
                                    <option value="medium">⚡ Frontier (Flash)</option>
                                    <option value="low">🤖 Local (Free)</option>
                                </select>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleSaveConfig}
                        disabled={saving}
                        className="mt-4 w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

                {/* ── Connection Guide + Engine Log ── */}
                <div className="space-y-6">
                    {/* Connection Guide */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
                        <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Settings size={14} /> Connection Guide
                        </h2>
                        <p className="text-xs text-indigo-600 mb-3">To use your own local models, install Ollama and enable CORS:</p>
                        <div className="bg-white/80 rounded-lg p-3 font-mono text-[11px] text-gray-700 border border-indigo-100 space-y-1">
                            <div className="text-indigo-400"># 1. Install Ollama</div>
                            <div>curl -fsSL https://ollama.com/install.sh | sh</div>
                            <div className="text-indigo-400 mt-2"># 2. Pull a model</div>
                            <div>ollama pull llama3</div>
                            <div className="text-indigo-400 mt-2"># 3. Start with CORS (for browser access)</div>
                            <div>OLLAMA_ORIGINS=* ollama serve</div>
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-3">
                            💡 Each user connects <strong>their own</strong> Ollama instance. Your machine is not required.
                        </p>
                    </div>

                    {/* Engine Log */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity size={14} /> Engine Log
                        </h2>
                        <div className="bg-gray-900 rounded-lg p-3 font-mono text-[11px] max-h-[240px] overflow-y-auto space-y-1">
                            {engineLog.length === 0 ? (
                                <div className="text-gray-600">No activity yet...</div>
                            ) : engineLog.map((line, i) => (
                                <div key={i} className={`${line.includes('✅') ? 'text-emerald-400' : line.includes('❌') || line.includes('⚠️') ? 'text-red-400' : line.includes('🔄') ? 'text-blue-400' : 'text-gray-400'}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
