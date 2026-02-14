"use client";

import React, { useState } from 'react';
import {
    Home, // Keep Home for now, though not used in new code, will remove if not needed
    Globe, // Keep Globe for now
    BarChart2, // Keep BarChart2 for now
    Settings,
    ChevronLeft,
    ChevronRight, // Keep ChevronRight for now
    Plus, // Keep Plus for now
    Zap, // Keep Zap for now
    LayoutDashboard, // New import
    Bot, // New import
    Users, // New import
    Activity // New import
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-lg mb-1
    ${active ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
    >
        <Icon size={20} />
        {label && <span className="text-sm">{label}</span>}
    </div>
);

export default function Sidebar({ activeView, setActiveView }: { activeView: string, setActiveView: (view: any) => void }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={`h-screen bg-gray-950 border-r border-white/5 transition-all duration-300 flex flex-col ${expanded ? 'w-64' : 'w-20'}`}>
            <div className="p-6 flex items-center justify-between border-b border-white/5 mb-4">
                {expanded && <div className="text-white font-bold text-xl flex items-center gap-2">
                    <img src="/velocity-logo.png" alt="Velocity" className="w-10 h-10 object-contain" />
                    <span className="tracking-tighter italic uppercase font-black text-lg">Velocity</span>
                </div>}
                {!expanded && <img src="/velocity-logo.png" alt="V" className="mx-auto w-10 h-10 object-contain cursor-pointer" onClick={() => setExpanded(true)} />}
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <SidebarItem icon={LayoutDashboard} label={expanded ? "Nodes" : ""} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <SidebarItem icon={Bot} label={expanded ? "Avon AI Builder" : ""} active={activeView === 'ai-builder'} onClick={() => setActiveView('ai-builder')} />
                <SidebarItem icon={Users} label={expanded ? "Team" : ""} active={activeView === 'team'} onClick={() => setActiveView('team')} />
                <SidebarItem icon={Activity} label={expanded ? "CI/CD Log" : ""} active={activeView === 'activity'} onClick={() => setActiveView('activity')} />
            </nav>

            <div className="p-4 border-t border-white/5">
                <SidebarItem icon={Settings} label={expanded ? "Settings" : ""} />
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-4 flex items-center justify-center p-2 text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className={`transition-transform duration-300 ${!expanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
    );
}
