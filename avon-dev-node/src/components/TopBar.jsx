export default function TopBar({ site, viewMode, setViewMode }) {
    return (
        <header className="h-10 flex items-center justify-between px-3 border-b border-neutral-800 bg-neutral-950 text-neutral-300">
            <div className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-[10px]">V</div>
                <span className="font-semibold text-neutral-100">{site?.name || 'Loading Node...'}</span>
                <span className="text-xs text-neutral-500 font-mono">/ {site?.status || 'INIT'}</span>
            </div>

            <div className="flex items-center bg-neutral-900 rounded-md p-0.5 border border-neutral-800">
                <button
                    onClick={() => setViewMode('editor')}
                    className={`px-4 py-1 rounded text-xs transition-all ${viewMode === 'editor' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Code
                </button>
                <button
                    onClick={() => setViewMode('preview')}
                    className={`px-4 py-1 rounded text-xs transition-all ${viewMode === 'preview' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Preview
                </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1">
                    <span>⚡</span> Deploy
                </button>
                <div className="h-6 w-6 rounded-full bg-neutral-700 ml-2 overflow-hidden border border-neutral-600">
                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${site?.id}`} alt="avatar" />
                </div>
            </div>
        </header>
    );
}
