"use client";

import React from 'react';
import { ExternalLink, MoreVertical, Globe, Settings2, Plus } from 'lucide-react';

const websites = [
    { id: 1, name: 'Marketing Agency', url: 'marketing-node.com', status: 'Active', thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400' },
    { id: 2, name: 'SaaS Platform', url: 'cloud-app.io', status: 'Active', thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400' },
    { id: 3, name: 'Estate Portfolio', url: 'estates-redemption.net', status: 'Pending', thumb: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400' },
    { id: 4, name: 'E-commerce Store', url: 'shop-velocity.co', status: 'Active', thumb: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=400' },
];

export default function WebsiteOverview() {
    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Website Overview</h2>
                    <p className="text-gray-500 text-sm">Manage and monitor your industrial node deployments.</p>
                </div>
                <button className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold shadow-blue-200 shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2">
                    <Plus size={20} />
                    Create Website
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {websites.map((site) => (
                    <div key={site.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                            <img
                                src={site.thumb}
                                alt={site.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${site.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {site.status}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    aria-label="Open Website"
                                    title="Open Website"
                                    className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors"
                                >
                                    <ExternalLink size={18} />
                                </button>
                                <button
                                    aria-label="Website Settings"
                                    title="Website Settings"
                                    className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors"
                                >
                                    <Settings2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex items-center justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{site.name}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                        <Globe size={12} />
                                        <span>{site.url}</span>
                                    </div>
                                </div>
                                <button
                                    aria-label="More Options"
                                    title="More Options"
                                    className="text-gray-400 hover:text-gray-900 p-1"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <button className="w-full mt-4 py-2 bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-all">
                                Manage Node
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
