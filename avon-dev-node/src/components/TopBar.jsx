import { Code2, MonitorPlay, Zap, ScanEye } from "lucide-react";

export default function TopBar({ site, viewMode, setViewMode, xrayMode, setXrayMode }) {
    return (
        <header className="h-14 flex items-center justify-between px-6 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md text-neutral-300 z-50 relative">
            <div className="flex items-center gap-4 text-sm w-1/3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">V</div>
                <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wide">{site?.name || 'Local Sandbox'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">{site?.status || 'CONNECTED'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center bg-neutral-900/80 rounded-xl p-1 border border-neutral-700/50 shadow-inner w-auto justify-center">
                <button
                    onClick={() => setViewMode('editor')}
                    className={`px-6 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${viewMode === 'editor' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:text-white'}`}
                >
                    <Code2 size={16} /> Code
                </button>
                <button
                    onClick={() => setViewMode('preview')}
                    className={`px-6 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${viewMode === 'preview' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:text-white'}`}
                >
                    <MonitorPlay size={16} /> Preview
                </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium w-1/3 justify-end">
                {viewMode === 'preview' && (
                    <button
                        onClick={() => setXrayMode(!xrayMode)}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-bold ring-1 ${xrayMode ? 'bg-indigo-500/20 text-indigo-400 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-neutral-900 text-neutral-400 hover:text-white ring-neutral-700/50 hover:ring-neutral-500 hover:bg-neutral-800'}`}
                    >
                        <ScanEye size={16} className={xrayMode ? "animate-pulse" : ""} /> {xrayMode ? "X-Ray Active" : "X-Ray Vision"}
                    </button>
                )}
                <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-105 active:scale-95">
                    <Zap size={16} fill="currentColor" /> Deploy
                </button>
                <div className="h-9 w-9 rounded-full bg-neutral-800 ml-2 overflow-hidden border-2 border-neutral-700 hover:border-blue-500 transition-colors cursor-pointer ring-2 ring-transparent hover:ring-blue-500/30">
                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${site?.id || 'avon'}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>
    );
}
