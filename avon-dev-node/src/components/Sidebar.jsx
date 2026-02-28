import { FolderCode, Save, Search, Box, Settings, Sparkles, HelpCircle } from "lucide-react";

const navItems = [
    { id: 'explorer', icon: FolderCode, label: "Explorer" },
    { id: 'search', icon: Search, label: "Search" },
    { id: 'blueprints', icon: Box, label: "Blueprints" },
    { id: 'swarm', icon: Sparkles, label: "AI Swarm" },
    { id: 'snapshots', icon: Save, label: "Snapshots" },
    { id: 'config', icon: Settings, label: "Config" }
];

export default function Sidebar({ activeTab, setActiveTab }) {
    return (
        <aside className="w-14 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-4 gap-4 z-50">
            {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={i}
                        title={item.label}
                        onClick={() => setActiveTab(item.id)}
                        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                            ? "bg-blue-600/10 text-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "text-neutral-500 hover:text-white hover:bg-neutral-800/80"
                            }`}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl"></div>
                        )}
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                )
            })}
            <div className="mt-auto flex flex-col gap-4">
                <button title="Help" className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 text-neutral-500 hover:text-white hover:bg-neutral-800/80 group">
                    <HelpCircle size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                </button>
            </div>
        </aside>
    );
}
