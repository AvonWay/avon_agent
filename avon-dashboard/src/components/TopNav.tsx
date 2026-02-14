"use client";

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export default function TopNav() {
    return (
        <div className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="hover:text-primary cursor-pointer">Websites</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">Dashboard</span>
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

                <button className="text-gray-400 hover:text-primary transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">Avon Agent</p>
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
