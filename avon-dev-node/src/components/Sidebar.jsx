const icons = ["📁", "💾", "🔍", "📦", "⚙️"];

export default function Sidebar() {
    return (
        <aside className="w-12 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-3 gap-3">
            {icons.map((icon, i) => (
                <button
                    key={i}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg text-lg transition-colors text-neutral-400 ${i === 0
                            ? "bg-neutral-800 text-neutral-100 ring-1 ring-neutral-700"
                            : "hover:bg-neutral-800 hover:text-neutral-200"
                        }`}
                >
                    <span>{icon}</span>
                </button>
            ))}
            <div className="mt-auto flex flex-col gap-3">
                <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400">
                    ?
                </button>
            </div>
        </aside>
    );
}
