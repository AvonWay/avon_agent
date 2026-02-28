import { FileCode2, X } from "lucide-react";

export default function EditorPane({ site, setSite }) {
    const codeLines = (site?.html || "<!-- Agent is writing... -->").split('\n');

    const handleChange = (e) => {
        if (setSite) {
            setSite(prev => ({ ...prev, html: e.target.value }));
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0d1117] relative">
            <div className="absolute top-0 right-0 p-2 text-xs text-neutral-600 font-mono opacity-50 select-none z-10 hidden sm:block">Language: HTML</div>
            <div className="h-10 flex items-center border-b border-neutral-800/80 bg-[#010409] px-2 gap-2 text-xs overflow-x-auto scrollbar-hide">
                <button className="h-full px-4 flex items-center gap-2 bg-[#0d1117] border-t-2 border-indigo-500 text-neutral-200 mt-[1px] relative rounded-t-md">
                    <FileCode2 size={14} className="text-indigo-400" />
                    <span className="font-medium tracking-wide">index.html</span>
                    <span className="ml-1 hover:bg-neutral-800 rounded-md p-0.5 flex items-center justify-center opacity-70 hover:opacity-100 transition-colors">
                        <X size={14} />
                    </span>
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#0d1117]"></div>
                </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-[13px] leading-6 p-4 text-[#c9d1d9] selection:bg-[#264f78] selection:text-white relative">
                <div className="flex w-full min-h-full h-fit">
                    <div className="flex flex-col text-[#484f58] select-none mr-4 text-right min-w-[32px] pr-4 border-r border-[#30363d] opacity-80 h-full">
                        {codeLines.map((_, i) => (
                            <span key={i}>{i + 1}</span>
                        ))}
                    </div>
                    <textarea
                        className="flex-1 bg-transparent w-full min-h-full resize-none outline-none border-none whitespace-pre break-all tabular-nums font-medium text-[#7ee787] overflow-hidden"
                        value={site?.html || "<!-- Initializing build... -->"}
                        onChange={handleChange}
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
