import React, { useState, useEffect } from 'react';
import { Globe, Zap, Cpu, Terminal, Shield, CheckCircle } from 'lucide-react';

function App() {
    const [node, setNode] = useState(null);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="velocity-preview-root flex items-center justify-center h-screen bg-gray-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-mono text-sm tracking-widest uppercase animate-pulse">Synchronizing Node...</p>
                </div>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="velocity-preview-root flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-8 text-center">
                <Globe size={64} className="text-red-500 mb-6 opacity-50" />
                <h1 className="text-4xl font-black italic uppercase mb-2">Node Offline</h1>
                <p className="text-gray-400 font-mono">Industrial DNS failed to resolve this instance.</p>
            </div>
        );
    }

    return (
        <div className="velocity-preview-root min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-600">
            {/* High-Velocity Header */}
            <header className="fixed top-0 inset-x-0 h-20 bg-gray-900/50 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-10">
                <div className="flex items-center gap-3">
                    <img src="/velocity-logo.png" alt="V" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.src = 'https://placehold.co/32x32?text=V'} />
                    <span className="text-xl font-black tracking-tight italic uppercase">Velocity Factory</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase text-[10px] font-bold tracking-widest">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Status: Live
                    </div>
                </div>
            </header>

            <main className="pt-40 pb-20 px-10 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                    {/* Left: AI Intent & Plan */}
                    <div className="space-y-12">
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                                Industrial Intent
                            </span>
                            <h1 className="text-6xl font-black tracking-tighter italic uppercase leading-tight">
                                {node.name || "Vibe Node"}
                            </h1>
                            <p className="text-xl text-gray-400 font-medium mt-6 leading-relaxed">
                                Generated based on the industrial command: <br />
                                <span className="text-white italic">"{node.ai_plan ? 'Custom Scale Request' : 'Standard Node Sync'}"</span>
                            </p>
                        </div>

                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] space-y-6">
                            <div className="flex items-center gap-3 text-blue-500">
                                <Cpu size={20} />
                                <h3 className="font-black uppercase text-sm tracking-widest">Avon AI Build Plan</h3>
                            </div>
                            <div className="font-mono text-sm text-gray-400 space-y-4 whitespace-pre-wrap leading-relaxed">
                                {node.ai_plan || "Building plan optimization in progress..."}
                            </div>
                        </div>
                    </div>

                    {/* Right: Technical Specs & Visuals */}
                    <div className="space-y-8">
                        <div className="aspect-square bg-blue-600/10 rounded-[3rem] border border-blue-600/20 relative overflow-hidden flex items-center justify-center p-20 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <Globe size={200} className="text-blue-600 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-x-10 bottom-10 p-6 bg-gray-900 shadow-2xl rounded-2xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Deployment ID</p>
                                    <p className="font-mono text-xs">{node.id}</p>
                                </div>
                                <Shield className="text-blue-600" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <Zap className="text-yellow-500 mb-3" size={20} />
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Velocity</p>
                                <p className="font-black italic uppercase text-lg">100x Scaling</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <Terminal className="text-blue-500 mb-3" size={20} />
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Architecture</p>
                                <p className="font-black italic uppercase text-lg">Static Node</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-8">End of Node Presentation</p>
                    <div className="flex gap-4">
                        <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full opacity-50"></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full opacity-20"></div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
