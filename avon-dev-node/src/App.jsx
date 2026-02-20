import React, { useState, useEffect } from "react";
import TopBar from "./components/TopBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import FileTree from "./components/FileTree.jsx";
import EditorPane from "./components/EditorPane.jsx";
import ConsolePane from "./components/ConsolePane.jsx";

// Loader Component
const LoadingSite = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-10 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 relative mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Agent is Building...</h2>
        <p className="text-gray-500 max-w-sm font-mono text-sm leading-relaxed">
            Generating site structure, styling components, and injecting business logic live at node.
        </p>
        <div className="mt-8 flex gap-2">
            <div className="h-1 w-12 bg-neutral-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
            <div className="h-1 w-12 bg-neutral-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-500 animate-[loading_2.5s_ease-in-out_infinite]"></div>
            </div>
            <div className="h-1 w-12 bg-neutral-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
        </div>
    </div>
);

export default function App() {
    const [site, setSite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview'

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const id = queryParams.get("id");

        if (!id) {
            setLoading(false);
            return;
        }

        // Handle temp IDs immediately
        if (id.startsWith("temp_")) {
            setSite({ id, status: 'Building', name: 'New Project' });
            setLoading(false);
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
            } finally {
                setLoading(false);
            }
        };

        fetchSite();
    }, []);

    const isBuilding = !site || site.status === 'Building' || site.status === 'Compiling';

    return (
        <div className="h-screen w-screen flex flex-col bg-neutral-900 text-gray-100 font-sans antialiased overflow-hidden">
            <TopBar site={site} viewMode={viewMode} setViewMode={setViewMode} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 border-l border-neutral-800 relative">
                    {isBuilding ? (
                        <LoadingSite />
                    ) : (
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-60 border-r border-neutral-800 bg-neutral-950 flex flex-col shrink-0">
                                <FileTree site={site} />
                            </div>
                            <div className="flex flex-1 flex-col overflow-hidden bg-neutral-900">
                                <div className="flex-1 overflow-hidden relative">
                                    {viewMode === 'editor' ? (
                                        <EditorPane site={site} />
                                    ) : (
                                        <div className="h-full w-full bg-white overflow-auto shadow-2xl m-4 rounded-lg border border-neutral-700">
                                            <div dangerouslySetInnerHTML={{ __html: site.html || '<center class="p-20 text-gray-400">No content generated yet.</center>' }} />
                                        </div>
                                    )}
                                </div>
                                <div className="h-48 shrink-0 relative border-t border-neutral-800">
                                    <ConsolePane site={site} />
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
