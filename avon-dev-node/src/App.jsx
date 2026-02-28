import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, ArrowRight, Command } from "lucide-react";
import TopBar from "./components/TopBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import FileTree from "./components/FileTree.jsx";
import EditorPane from "./components/EditorPane.jsx";
import ConsolePane from "./components/ConsolePane.jsx";
import AgentChat from "./components/AgentChat.jsx";

// Loader Component
const LoadingSite = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const sequence = [
            { text: "Architect: Designing schema...", delay: 500, status: "in-progress" },
            { text: "Architect: Designing schema... 🟢 done", delay: 2000, status: "done", updateIdx: 0 },
            { text: "Builder: Scaffolding React components... 🟡 in progress", delay: 2500, status: "in-progress" },
            { text: "Builder: Scaffolding React components... 🟢 done", delay: 4500, status: "done", updateIdx: 1 },
            { text: "Builder: Writing Tailwind styles... 🟡 in progress", delay: 5000, status: "in-progress" },
            { text: "Builder: Writing Tailwind styles... 🟢 done", delay: 7000, status: "done", updateIdx: 2 },
            { text: "Guardian: Auditing accessibility and responsiveness... 🟡 in progress", delay: 7500, status: "in-progress" },
            { text: "Guardian: Auditing accessibility and responsiveness... 🟢 done", delay: 9500, status: "done", updateIdx: 3 },
            { text: "Architect: Finalizing deployment bundle... 🟡 in progress", delay: 10000, status: "in-progress" },
            { text: "Architect: Finalizing deployment bundle... 🟢 done", delay: 11500, status: "done", updateIdx: 4 },
        ];

        let isMounted = true;
        const timeouts = [];

        sequence.forEach((step) => {
            const timeout = setTimeout(() => {
                if (!isMounted) return;
                setLogs(prev => {
                    if (step.updateIdx !== undefined) {
                        const newLogs = [...prev];
                        if (newLogs[step.updateIdx]) {
                            newLogs[step.updateIdx] = { text: step.text, status: step.status };
                        }
                        return newLogs;
                    } else {
                        return [...prev, { text: step.text, status: step.status }];
                    }
                });
            }, step.delay);
            timeouts.push(timeout);
        });

        return () => {
            isMounted = false;
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-10 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 relative mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Swarm Intelligence Active</h2>
            <p className="text-gray-500 max-w-sm font-mono text-sm leading-relaxed mb-8">
                Avon agents are collaborating to build your node...
            </p>

            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left font-mono text-xs shadow-2xl overflow-hidden h-48 flex flex-col justify-end">
                <div className="flex flex-col gap-2 overflow-y-auto w-full">
                    {logs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 w-full ${log.status === 'done' ? 'text-green-400' : 'text-blue-400'}`}>
                            <span className="shrink-0 mt-0.5">{log.status === 'done' ? '✓' : '⟳'}</span>
                            <span className="break-words whitespace-pre-wrap">{log.text}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 text-neutral-500 mt-2">
                        <span className="animate-pulse w-2 h-4 bg-neutral-500 align-middle inline-block" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [site, setSite] = useState(null);
    const [viewMode, setViewMode] = useState('preview'); // 'editor' | 'preview'
    const [activeTab, setActiveTab] = useState('explorer');
    const [xrayMode, setXrayMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [promptActive, setPromptActive] = useState(false);
    const [promptQuery, setPromptQuery] = useState("");
    const promptInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setPromptActive(prev => {
                    const next = !prev;
                    if (next) {
                        setTimeout(() => promptInputRef.current?.focus(), 50);
                    }
                    return next;
                });
            }
            if (e.key === 'Escape') {
                setPromptActive(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const processFiles = useCallback((files) => {
        const imageFiles = files.filter(f => f && f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setAnalyzingImage(true);
        // Simulate reading the image and updating the AI blueprint
        setTimeout(() => {
            setAnalyzingImage(false);
            setSite(prev => {
                if (!prev) return prev;
                let newHtml = prev.html || '';
                // Injecting a visual indicator
                if (newHtml.includes('</body>')) {
                    newHtml = newHtml.replace('</body>', '\n<!-- Vibe Injected -->\n<div style="position:fixed;bottom:20px;right:20px;background:#6366f1;color:white;padding:10px 20px;border-radius:24px;font-family:sans-serif;font-size:13px;font-weight:bold;z-index:9999;box-shadow:0 8px 32px rgba(99,102,241,0.4);animation:slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);">✨ Vibe Applied Successfully</div><style>@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>\n</body>');
                } else {
                    newHtml += '\n<!-- Vibe Injected -->\n<div>✨ Vibe Applied successfully</div>';
                }
                return { ...prev, html: newHtml };
            });
        }, 3500);
    }, []);

    useEffect(() => {
        const handlePaste = (e) => {
            const items = Array.from(e.clipboardData.items || []);
            const files = items.filter(item => item.type.startsWith('image/')).map(item => item.getAsFile());
            if (files.length > 0) {
                processFiles(files);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [processFiles]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        // Only trigger false if leaving the window content completely
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        processFiles(files);
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const id = queryParams.get("id");

        if (!id) {
            setSite({ id: null, status: 'IDLE', name: 'Blank Project', html: '' });
            return;
        }

        // Handle temp IDs immediately
        if (id.startsWith("temp_")) {
            setSite({ id, status: 'Building', name: 'New Project' });
            return;
        }

        const fetchSite = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/public/sites/${id}`);
                const data = await res.json();
                setSite(data);

                // If it's building, poll every 2 seconds
                if (data.status === 'Building' || data.status === 'Compiling') {
                    setTimeout(fetchSite, 2000);
                }
            } catch (err) {
                console.error("Fetch failed", err);
                setSite({ id, status: 'ERROR', name: 'Failed to Load', html: '<center>Error loading site.</center>' });
            }
        };

        fetchSite();
    }, []);

    const isBuilding = site && (site.status === 'Building' || site.status === 'Compiling');

    return (
        <div className="h-screen w-screen flex flex-col bg-[#010409] text-gray-100 font-sans antialiased overflow-hidden">
            <TopBar site={site} viewMode={viewMode} setViewMode={setViewMode} xrayMode={xrayMode} setXrayMode={setXrayMode} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div
                    className="flex flex-1 border-l border-neutral-800 relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className="absolute inset-0 z-[100] bg-blue-500/10 backdrop-blur-sm border-2 border-dashed border-blue-500 m-4 rounded-xl flex items-center justify-center pointer-events-none">
                            <div className="bg-neutral-900 border border-neutral-800 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center">
                                <div className="text-5xl mb-4 animate-bounce">📸</div>
                                <h2 className="text-xl font-bold text-white mb-2">Drop Image to Vibe-Code</h2>
                                <p className="text-blue-400 font-mono text-sm">Avon will reverse-engineer the style</p>
                            </div>
                        </div>
                    )}
                    {analyzingImage && (
                        <div className="absolute inset-0 z-[100] bg-neutral-950/80 backdrop-blur-md flex items-center justify-center">
                            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col items-center shadow-2xl max-w-md text-center">
                                <div className="w-16 h-16 relative mb-6">
                                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-xl">👁️</div>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Reverse-Engineering Vibe...</h2>
                                <p className="text-neutral-400 text-sm">Extracting color palettes, typography, and structural patterns from your image.</p>
                            </div>
                        </div>
                    )}
                    {isBuilding ? (
                        <LoadingSite />
                    ) : (
                        <div className="flex flex-1 overflow-hidden">
                            <div className="flex flex-col shrink-0">
                                {activeTab === 'explorer' && <FileTree />}
                                {activeTab === 'swarm' && <AgentChat />}
                                {activeTab !== 'explorer' && activeTab !== 'swarm' && (
                                    <div className="w-14 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0"></div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col overflow-hidden bg-neutral-900 border-l border-neutral-800">
                                <div className="flex-1 overflow-hidden relative">
                                    {viewMode === 'editor' ? (
                                        <EditorPane site={site} setSite={setSite} />
                                    ) : (
                                        <div
                                            className={`h-full w-full bg-white overflow-auto shadow-2xl m-4 rounded-lg border border-neutral-700 relative ${xrayMode ? 'xray-mode-active' : ''}`}
                                            onClick={(e) => {
                                                if (!xrayMode) return;
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const target = e.target;

                                                if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV', 'A', 'BUTTON'].includes(target.tagName)) {
                                                    if (!target.isContentEditable) {
                                                        target.contentEditable = true;
                                                        target.focus();
                                                    }
                                                }

                                                if (['IMG', 'VIDEO'].includes(target.tagName)) {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = target.tagName === 'IMG' ? 'image/*' : 'video/*';
                                                    input.onchange = (ev) => {
                                                        const file = ev.target.files[0];
                                                        if (file) {
                                                            target.src = URL.createObjectURL(file);
                                                        }
                                                    };
                                                    input.click();
                                                }
                                            }}
                                        >
                                            <div dangerouslySetInnerHTML={{ __html: site?.html || '<center class="p-20 text-gray-400">No content generated yet.</center>' }} />
                                            {xrayMode && (
                                                <div className="absolute inset-0 pointer-events-none" style={{
                                                    backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
                                                    backgroundSize: '20px 20px',
                                                    zIndex: 999
                                                }}>
                                                    <style>{`
                                                        .xray-mode-active * {
                                                            outline: 2px dashed rgba(20, 83, 45, 0.4) !important;
                                                            position: relative;
                                                            transition: all 0.2s;
                                                        }
                                                        .xray-mode-active *:hover {
                                                            outline: 3px solid #166534 !important;
                                                            background-color: rgba(34, 197, 94, 0.1) !important;
                                                            z-index: 1000;
                                                            cursor: text;
                                                        }
                                                        .xray-mode-active img:hover, .xray-mode-active video:hover {
                                                            cursor: pointer;
                                                            filter: brightness(0.8);
                                                        }
                                                        .xray-mode-active *:hover::after {
                                                            content: '✏️ Edit ' + attr(tagName);
                                                            position: absolute;
                                                            top: -28px;
                                                            left: -2px;
                                                            background: #166534;
                                                            color: white;
                                                            font-size: 11px;
                                                            font-weight: bold;
                                                            padding: 4px 8px;
                                                            border-radius: 4px;
                                                            font-family: sans-serif;
                                                            white-space: nowrap;
                                                            pointer-events: none;
                                                        }
                                                        .xray-mode-active img:hover::after, .xray-mode-active video:hover::after {
                                                            content: '📸 Replace Media';
                                                        }
                                                    `}</style>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Cmd+K Prompt Overlay */}
                                    <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[600px] z-[1000] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${promptActive ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
                                        <div className="bg-[#0d1117]/90 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.15)] p-1.5 flex flex-col gap-2 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-600/10 opacity-50 pointer-events-none"></div>
                                            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                                            <div className="flex items-center gap-3 px-3 py-2.5 relative z-10 w-full">
                                                <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                                                    <Sparkles size={18} className="animate-pulse" />
                                                </div>
                                                <input
                                                    ref={promptInputRef}
                                                    type="text"
                                                    value={promptQuery}
                                                    onChange={(e) => setPromptQuery(e.target.value)}
                                                    placeholder="Ask Swarm to edit this view... (e.g. 'Make it cyberpunk')"
                                                    className="bg-transparent border-none outline-none text-[#e6edf3] flex-1 text-[15px] font-medium placeholder-[#8b949e] w-full"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && promptQuery.trim()) {
                                                            setPromptActive(false);
                                                            setPromptQuery('');
                                                            setAnalyzingImage(true);
                                                            setTimeout(() => setAnalyzingImage(false), 2500);
                                                        }
                                                    }}
                                                />
                                                <div className="flex items-center gap-1.5 bg-[#21262d] px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-[#8b949e] border border-[#30363d] select-none">
                                                    <Command size={10} />
                                                    <span>K</span>
                                                </div>
                                                <button className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors shadow-lg shadow-blue-500/25 active:scale-95 group-focus-within:bg-blue-500 ml-1">
                                                    <ArrowRight size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-48 shrink-0 relative border-t border-neutral-800">
                                    <ConsolePane />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-blue-600 flex items-center px-4 justify-between text-[10px] uppercase font-bold tracking-widest text-white shrink-0">
                <div className="flex gap-4">
                    <span>{site?.status || 'IDLE'}</span>
                    <span>{site?.id || 'NO_SESSION'}</span>
                </div>
                <div className="flex gap-4">
                    <span>JS • UTF-8</span>
                    <span>PORT: 3001</span>
                </div>
            </div>
        </div>
    );
}
