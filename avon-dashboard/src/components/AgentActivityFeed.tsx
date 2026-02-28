"use client";
/**
 * ════════════════════════════════════════════════════════════
 *  CG-003: Agent Activity Feed
 *  avon-dashboard/src/components/AgentActivityFeed.tsx
 *
 *  Velocity Swarm — CodeGemma Lane
 *  Directive: VD-2026-02-27-001
 * ════════════════════════════════════════════════════════════
 *
 *  Reads from GET /api/evolution/history.
 *  Shows last 10 evolution events in a timeline.
 *  Color-coded by priority: CRITICAL=red, HIGH=amber,
 *  MEDIUM=blue, LOW=green.
 * ════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import {
    AlertOctagon, AlertTriangle, Info, CheckCircle,
    RefreshCw, FileCode, Zap, Bug, GitMerge
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ─── Types ───────────────────────────────────────────────────
interface EvolutionEntry {
    timestamp: string;
    cycle?: number;
    type?: string;          // 'evolution_error' | undefined (success)
    stage?: string;         // error stage
    analysis?: string;
    priority?: 'critical' | 'high' & 'medium' | 'low' | 'none';
    patchCount?: number;
    changedFiles?: string[];
    reason?: string;
}

// ─── Priority Config ─────────────────────────────────────────
const PRIORITY_CONFIG = {
    critical: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
        text: 'text-red-400',
        label: 'CRITICAL',
        icon: AlertOctagon,
    },
    high: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        text: 'text-amber-400',
        label: 'HIGH',
        icon: AlertTriangle,
    },
    medium: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
        text: 'text-blue-400',
        label: 'MEDIUM',
        icon: Info,
    },
    low: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
        text: 'text-emerald-400',
        label: 'LOW',
        icon: CheckCircle,
    },
    none: {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/30',
        dot: 'bg-gray-400',
        text: 'text-gray-400',
        label: 'ERROR',
        icon: Bug,
    },
} as const;

// ─── Time Formatter ──────────────────────────────────────────
function timeAgo(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single Event Row ─────────────────────────────────────────
function EventRow({ entry }: { entry: EvolutionEntry }) {
    const isError = entry.type === 'evolution_error';
    const priority = (entry.priority as keyof typeof PRIORITY_CONFIG) ?? (isError ? 'none' : 'low');
    const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.none;
    const Icon = isError || !entry.patchCount ? cfg.icon : GitMerge;

    return (
        <div className={`relative flex gap-4 rounded-xl p-4 border ${cfg.bg} ${cfg.border} transition-all hover:brightness-110`}>
            {/* Icon */}
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                <Icon size={14} className={cfg.text} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {entry.cycle != null && (
                        <span className="text-white font-semibold text-sm">Cycle #{entry.cycle}</span>
                    )}
                    {isError && entry.stage && (
                        <span className="text-white font-semibold text-sm capitalize">{entry.stage} error</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        {cfg.label}
                    </span>
                    {entry.patchCount != null && entry.patchCount > 0 && (
                        <span className="text-xs text-gray-400">
                            {entry.patchCount} patch{entry.patchCount !== 1 ? 'es' : ''} applied
                        </span>
                    )}
                </div>

                {/* Analysis / Reason */}
                {(entry.analysis || entry.reason) && (
                    <p className="text-gray-300 text-xs mt-1 leading-relaxed line-clamp-2">
                        {entry.analysis || entry.reason}
                    </p>
                )}

                {/* Changed Files */}
                {entry.changedFiles && entry.changedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.changedFiles.slice(0, 4).map(f => (
                            <span key={f} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 font-mono">
                                <FileCode size={9} />
                                {f.split('/').pop()}
                            </span>
                        ))}
                        {entry.changedFiles.length > 4 && (
                            <span className="text-[10px] text-gray-500">+{entry.changedFiles.length - 4} more</span>
                        )}
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <div className="shrink-0 text-right">
                <span className="text-gray-500 text-[10px]">{timeAgo(entry.timestamp)}</span>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────
export default function AgentActivityFeed() {
    const [entries, setEntries] = useState<EvolutionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchHistory = async (showLoader = false) => {
        if (showLoader) setIsRefreshing(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('avon_token') : null;
            const res = await fetch(`${BACKEND_URL}/api/evolution/history`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setEntries((data.entries ?? []).slice(0, 10));
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            if (showLoader) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const id = setInterval(() => fetchHistory(), 30_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-xl backdrop-blur-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
                        <Zap size={18} className="text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Agent Activity Feed</h3>
                        <p className="text-gray-400 text-xs">Last 10 evolution events</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchHistory(true)}
                    disabled={isRefreshing}
                    aria-label="Refresh activity feed"
                    id="agent-feed-refresh"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading && (
                    <div className="flex flex-col gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <AlertTriangle size={14} className="text-red-400 shrink-0" />
                        <p className="text-red-300 text-xs">{error}</p>
                    </div>
                )}

                {!loading && !error && entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-white/5 mb-3">
                            <Zap size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No evolution events yet</p>
                        <p className="text-gray-600 text-xs mt-1">Events will appear once the engine runs its first cycle.</p>
                    </div>
                )}

                {!loading && entries.map((entry, i) => (
                    <EventRow key={`${entry.timestamp}-${i}`} entry={entry} />
                ))}
            </div>
        </div>
    );
}
