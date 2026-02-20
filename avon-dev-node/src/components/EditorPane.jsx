export default function EditorPane({ site }) {
    const codeLines = (site?.html || "<!-- Agent is writing... -->").split('\n');

    return (
        <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-800 relative">
            <div className="absolute top-0 right-0 p-2 text-xs text-neutral-500 font-mono opacity-50 select-none">Language: HTML</div>
            <div className="h-9 flex items-center border-b border-neutral-800 bg-neutral-950 px-2 gap-2 text-xs">
                <button className="h-full px-3 flex items-center gap-2 bg-neutral-800/50 border-t-2 border-blue-500 text-neutral-200">
                    <span className="text-blue-400">●</span>
                    <span>index.html</span>
                    <span className="ml-2 hover:bg-neutral-700 rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-50 hover:opacity-100">×</span>
                </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-sm leading-6 p-4 text-neutral-300 selection:bg-blue-900 selection:text-blue-100">
                <div className="flex">
                    <div className="flex flex-col text-neutral-700 select-none mr-4 text-right min-w-[30px] border-r border-neutral-800 pr-2">
                        {codeLines.map((_, i) => (
                            <span key={i}>{i + 1}</span>
                        ))}
                    </div>
                    <pre className="whitespace-pre-wrap break-all tabular-nums text-emerald-400/90">
                        {site?.html || "<!-- Initializing build... -->"}
                    </pre>
                </div>
            </div>
        </div>
    );
}
