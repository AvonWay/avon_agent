import React, { useState, useEffect, useRef } from 'react';
import { Globe, Zap, Cpu, Terminal, Shield, CheckCircle, Code, Layout, Box, Activity, ChevronRight, Play } from 'lucide-react';

// --- Vibe Components ---

const MatrixBackground = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-pulse delay-75"></div>
        <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-pulse delay-1000"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-pulse delay-500"></div>
    </div>
);

const Typewriter = ({ text, speed = 10 }) => {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.substring(0, i));
            i += 2; // Faster typing
            if (i > text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text]);

    return <pre className="font-mono text-xs text-blue-300/80 whitespace-pre-wrap leading-relaxed">{displayed}<span className="animate-pulse">|</span></pre>;
};

const MockupGenerator = ({ plan }) => {
    // Simple heuristic to show relevant UI chunks based on plan keywords
    const showPricing = plan?.toLowerCase().includes('pricing') || plan?.toLowerCase().includes('saas');
    const showDashboard = plan?.toLowerCase().includes('dashboard') || plan?.toLowerCase().includes('analytics');
    const showLanding = !showPricing && !showDashboard;

    return (
        <div className="w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative group">
            <div className="h-6 bg-gray-800 flex items-center px-4 gap-2 border-b border-gray-700">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="ml-4 px-2 py-0.5 bg-gray-900 rounded text-[10px] text-gray-500 font-mono w-64 text-center">localhost:3000</div>
            </div>

            <div className="p-8 relative min-h-[400px]">
                {/* Vibe Overlay */}
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {showLanding && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="h-12 w-3/4 bg-gray-800 rounded-lg mx-auto"></div>
                        <div className="h-4 w-1/2 bg-gray-800/50 rounded mx-auto"></div>
                        <div className="grid grid-cols-3 gap-4 pt-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-800/30 rounded-xl border border-dashed border-gray-700"></div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-4"><button className="px-8 py-3 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest">Get Started</button></div>
                    </div>
                )}

                {showPricing && (
                    <div className="grid grid-cols-3 gap-6 pt-10 animate-in fade-in zoom-in duration-500">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`p-6 rounded-2xl border ${i === 2 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/30'} flex flex-col gap-4 relative`}>
                                {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-[9px] font-black uppercase rounded-full">Most Popular</div>}
                                <div className="h-4 w-12 bg-gray-700 rounded"></div>
                                <div className="h-8 w-24 bg-gray-600 rounded"></div>
                                <div className="space-y-2 pt-4">
                                    <div className="h-2 w-full bg-gray-700/50 rounded"></div>
                                    <div className="h-2 w-full bg-gray-700/50 rounded"></div>
                                    <div className="h-2 w-2/3 bg-gray-700/50 rounded"></div>
                                </div>
                                <div className={`mt-auto h-8 w-full rounded ${i === 2 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
                            </div>
                        ))}
                    </div>
                )}

                {showDashboard && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex gap-4">
                            <div className="w-16 h-full space-y-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-gray-800"></div>)}
                            </div>
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl border border-gray-700"></div>)}
                                </div>
                                <div className="h-64 bg-gray-800/50 rounded-xl border border-gray-700 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
                                    <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 100 20">
                                        <path d="M0 20 L20 10 L40 15 L60 5 L80 12 L100 0 V20 H0 Z" fill="rgba(59, 130, 246, 0.2)" />
                                        <path d="M0 20 L20 10 L40 15 L60 5 L80 12 L100 0" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main App ---

function App() {
    const [node, setNode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const nodeId = urlParams.get('id');
        if (nodeId) {
            fetchNodeData(nodeId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchNodeData = async (id) => {
        try {
            const res = await fetch(`http://localhost:4000/api/public/sites/${id}`);
            if (res.ok) {
                const data = await res.json();
                setNode(data);
            } else {
                // Fallback for demo purposes if backend 404s
                if (id === 'demo') {
                    setNode({
                        name: 'Velocity Demo Node',
                        ai_plan: '# Plan\n- SaaS Dashboard\n- Stripe Integration\n- Dark Mode UI',
                        id: 'demo_123'
                    });
                } else {
                    setError('Node not found in standard registry.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Connection refused. Velocity Backend may be offline.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505] text-white overflow-hidden relative">
                <MatrixBackground />
                <div className="flex flex-col items-center gap-6 z-10">
                    <div className="relative">
                        <div className="w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={20} className="text-blue-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="font-black text-xl tracking-tighter uppercase italic">Velocity Engine</p>
                        <p className="font-mono text-xs text-blue-400 tracking-widest uppercase animate-pulse">Initializing Virtual Containment...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !node) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white p-8 text-center relative overflow-hidden">
                <MatrixBackground />
                <div className="z-10 bg-gray-900/50 backdrop-blur-xl p-10 rounded-3xl border border-red-500/20 shadow-2xl max-w-md w-full">
                    <Activity size={64} className="text-red-500 mb-6 opacity-80 mx-auto animate-pulse" />
                    <h1 className="text-3xl font-black italic uppercase mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">Sync Failure</h1>
                    <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">{error || "Industrial DNS failed to resolve this instance."}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-600/10 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-xl font-bold uppercase tracking-widest text-xs">
                        Retry Uplink
                    </button>
                </div>
            </div>
        );
    }

    if (node.build_artifact) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col">
                <header className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 text-xs z-50">
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-mono text-white">{node.domain}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-500 rounded uppercase font-bold tracking-wider text-[10px]">Velocity Live</span>
                    </div>
                </header>
                <iframe
                    srcDoc={node.build_artifact}
                    className="flex-1 w-full border-none bg-white"
                    title="Velocity Deployment"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups-to-escape-sandbox"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-600 overflow-x-hidden">
            <MatrixBackground />

            {/* Velocity HUD */}
            <header className="fixed top-0 inset-x-0 h-20 bg-black/50 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                        <span className="font-black italic text-xl">V</span>
                    </div>
                    <div>
                        <h1 className="font-black italic uppercase tracking-tighter text-lg leading-none">Velocity</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vibe Coding Terminal v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Code Stream */}
                    <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-left-10 duration-700">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                <Code size={12} />
                                <span>Injecting Logic</span>
                            </div>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600">
                                {node.name || "Untitled Build"}
                            </h2>
                        </div>

                        <div className="bg-black/80 rounded-2xl border border-gray-800 p-6 shadow-2xl backdrop-blur-lg relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-50"><Terminal size={20} className="text-gray-600" /></div>
                            <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <Typewriter text={node.ai_plan || "Initializing build sequence..."} speed={5} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex items-center gap-3">
                                <Box className="text-purple-500" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Components</p>
                                    <p className="font-mono text-sm font-bold">Auto-Scaled</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex items-center gap-3">
                                <Layout className="text-cyan-500" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Layout</p>
                                    <p className="font-mono text-sm font-bold">Responsive</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Preview Hologram */}
                    <div className="lg:col-span-7 animate-in slide-in-from-right-10 duration-1000 delay-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Play size={20} className="text-blue-500 fill-blue-500" />
                                <span className="font-black italic uppercase text-xl">Live Render</span>
                            </div>
                            <div className="text-[10px] font-mono text-gray-500">Preview Mode: High Fidelity</div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <MockupGenerator plan={node.ai_plan} />
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-xs text-gray-500 font-mono">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Deployment Verified</span>
                            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                            <span>{node.domain}</span>
                            <span className="ml-auto opacity-50">Latency: 12ms</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
