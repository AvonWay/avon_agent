import { TerminalSquare, Trash2 } from "lucide-react";

export default function ConsolePane() {
    return (
        <div className="h-full flex flex-col bg-[#010409] border-t border-[#30363d] text-[#e6edf3]">
            <div className="h-10 flex items-center justify-between px-4 text-xs border-b border-[#30363d] bg-[#0d1117]">
                <span className="uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-2">
                    <TerminalSquare size={14} className="text-emerald-400" />
                    Avon Swarm Output
                </span>
                <button className="text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 opacity-70 hover:opacity-100" title="Clear logs">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-[13px] p-4 select-text leading-relaxed shadow-inner">
                <div className="text-[#3fb950] mb-1 font-semibold flex items-center gap-2">
                    <span>❯</span> <span className="text-[#e6edf3]">Initializing Avon AI Swarm...</span>
                </div>
                <div className="text-[#8b949e] mb-1">Connecting to local interface at http://localhost:11434 🟢</div>
                <div className="text-[#58a6ff] mb-1">[Guardian] Analyzing request blueprint...</div>
                <div className="text-[#d2a8ff] mb-1">[Architect] Scaffolding DOM Tree injected at port 3001.</div>
                <div className="text-[#ff7b72] mb-1 invisible">No errors detected.</div>

                <div className="flex items-center gap-2 text-[#8b949e] mt-3">
                    <span className="text-[#3fb950] font-bold">❯</span>
                    <span className="animate-pulse w-2 h-4 bg-[#e6edf3] align-middle inline-block shadow-[0_0_8px_rgba(230,237,243,0.8)]" />
                </div>
            </div>
        </div>
    );
}
