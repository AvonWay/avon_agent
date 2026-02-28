"use client";
/**
 * CG-002: WebsiteOverview — Live data from GET /api/sites
 * Velocity Swarm — CodeGemma Lane
 * Directive: VD-2026-02-27-001
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ExternalLink, MoreVertical, Globe, Settings2, Plus, AlertTriangle, LayoutGrid } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ─── Types ────────────────────────────────────────────────────
interface Site {
    id: string;
    site_name: string;
    domain: string;
    status: 'active' | 'pending' | 'failed';
    config?: { prompt?: string; theme?: string; build_artifact?: string };
    created_at: string;
}

// ─── Skeleton Card ────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-video bg-gray-100" />
            <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded-lg mt-4" />
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg = {
        active: 'bg-green-100 text-green-600',
        pending: 'bg-amber-100 text-amber-600',
        failed: 'bg-red-100 text-red-600',
    }[status] ?? 'bg-gray-100 text-gray-500';

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg}`}>
            {status}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────
export default function WebsiteOverview() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSites = useCallback(async () => {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('avon_token') : null;
        try {
            const res = await fetch(`${BACKEND_URL}/api/sites`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Site[] = await res.json();
            setSites(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load sites');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSites(); }, [fetchSites]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Website Overview</h2>
                    <p className="text-gray-500 text-sm">Manage and monitor your industrial node deployments.</p>
                </div>
                <button
                    id="create-website-btn"
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold shadow-blue-200 shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create Website
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchSites} className="ml-auto underline text-xs">Retry</button>
                </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && sites.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-5 rounded-full bg-gray-100 mb-4">
                        <LayoutGrid size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-gray-700 font-semibold text-lg mb-1">No sites yet</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Create your first industrial node deployment to see it appear here.
                    </p>
                    <button className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2">
                        <Plus size={18} />
                        Create First Site
                    </button>
                </div>
            )}

            {/* Live Site Cards */}
            {!loading && sites.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sites.map((site) => (
                        <div key={site.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            {/* Thumbnail / Placeholder */}
                            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center">
                                <Globe size={32} className="text-indigo-300 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 left-3">
                                    <StatusBadge status={site.status} />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        aria-label={`Open ${site.site_name}`}
                                        title="Open Website"
                                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        aria-label={`Settings for ${site.site_name}`}
                                        title="Website Settings"
                                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors"
                                    >
                                        <Settings2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                                            {site.site_name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                            <Globe size={12} />
                                            <span className="truncate">{site.domain}</span>
                                        </div>
                                    </div>
                                    <button
                                        aria-label={`More options for ${site.site_name}`}
                                        title="More Options"
                                        className="text-gray-400 hover:text-gray-900 p-1 shrink-0"
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
            )}
        </div>
    );
}
