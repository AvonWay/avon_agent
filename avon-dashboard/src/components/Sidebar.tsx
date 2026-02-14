"use client";

import React, { useState } from 'react';
import {
    Home,
    Globe,
    BarChart2,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    Zap
} from 'lucide-react';

export default function Sidebar() {
    const [expanded, setExpanded] = useState(true);

    const menuItems = [
        { icon: <Home size={20} />, label: 'Dashboard', active: true },
        { icon: <Globe size={20} />, label: 'Websites', active: false },
        { icon: <BarChart2 size={20} />, label: 'Stats', active: false },
        { icon: <Zap size={20} />, label: 'Optimization', active: false },
        { icon: <Settings size={20} />, label: 'Settings', active: false },
    ];

    return (
        <div className={`h-screen bg-white border-r border-gray-100 transition-all duration-300 flex flex-col ${expanded ? 'w-64' : 'w-20'}`}>
            <div className="p-6 flex items-center justify-between">
                {expanded && <div className="text-primary font-bold text-xl flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">W</div>
                    <span>10Web</span>
                </div>}
                {!expanded && <div className="mx-auto w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-not-allowed transition-colors
              ${item.active ? 'bg-blue-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <div className={expanded ? '' : 'mx-auto'}>{item.icon}</div>
                        {expanded && <span className="font-medium">{item.label}</span>}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-50">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-primary transition-colors"
                >
                    {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>
        </div>
    );
}
