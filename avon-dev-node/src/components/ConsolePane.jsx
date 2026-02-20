export default function ConsolePane() {
    return (
        <div className="h-full flex flex-col bg-neutral-950 border-t border-neutral-800 text-neutral-300">
            <div className="h-8 flex items-center justify-between px-3 text-xs border-b border-neutral-800 bg-neutral-900/50">
                <span className="uppercase tracking-wide font-bold text-neutral-500">
                    Terminal
                </span>
                <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
                    Clear
                </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-xs p-3 select-text">
                <div className="text-emerald-500 mb-1">$ node main.js</div>
                <div className="text-neutral-200 mb-1">Hello, World!</div>
                <div className="flex items-center gap-2 text-neutral-500 mt-2">
                    <span className="text-emerald-500">$</span>
                    <span className="animate-pulse w-2 h-4 bg-neutral-500 align-middle inline-block" />
                </div>
            </div>
        </div>
    );
}
