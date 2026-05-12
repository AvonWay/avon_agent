"use client";

import React from 'react';
import { Bell, Search, User, Cpu, ChevronDown, Code } from 'lucide-react';

export default function TopNav() {
    return (
        <div className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-4 text-gray-500">
                    <span className="hover:text-primary cursor-pointer font-bold tracking-wide">VELOCITY SWARM</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Chat Interface</span>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-2"></div>

                <div className="relative group">
                    <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary transition-colors font-medium">
                        Developer
                        <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                    </button>
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-48 bg-white border border-gray-100 rounded-lg shadow-xl p-2 z-50">
                        <a href="/app/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-primary rounded-md transition-all">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                            Dashboard
                        </a>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search websites..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                {/* Model Selector: showing agnostic engine status */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-100 shadow-sm">
                        <Cpu size={12} className="text-blue-600" />
                        <span>Agnostic Engine</span>
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-100 shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors">
                        <TrendingUp size={12} className="text-emerald-600" />
                        <span>Trade Live</span>
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                        <Code size={12} className="text-amber-600" />
                        <span>OpenCode</span>
                        <div className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                            <span className="px-1 bg-amber-100 text-amber-600 rounded text-[8px]">LOCAL</span>
                        </div>
                    </div>
                </div>

                <button
                    aria-label="Notifications"
                    title="Notifications"
                    className="text-gray-400 hover:text-primary transition-colors relative"
                >
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">Velocity Agent</p>
                        <p className="text-xs text-gray-500">Admin</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icons
const TrendingUp = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

