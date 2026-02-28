"use client";
/**
 * ════════════════════════════════════════════════════════════
 *  CG-001: Evolution Engine Dashboard Widget
 *  avon-dashboard/src/components/EvolutionMonitor.tsx
 *
 *  Velocity Swarm — CodeGemma Lane
 *  Directive: VD-2026-02-27-001
 * ════════════════════════════════════════════════════════════
 *
 *  Live-polls GET /api/evolution/status every 10 seconds.
 *  Displays: Engine state, cycle count, last evolution ts,
 *  memory/latency telemetry sparkline.
 *  Visual: Dark glassmorphism card with animated pulse dot.
 * ════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    Activity, Zap, Shield, Clock, Cpu, AlertTriangle,
    CheckCircle, RefreshCw, StopCircle, Play
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const POLL_INTERVAL_MS = 10_000;

// ─── Types ───────────────────────────────────────────────────
interface TelemetryEntry {
    timestamp: string;
    heapUsedMB: number;
    apiLatencyMs: number | null;
    cycle: number;
}

interface EngineStatus {
    engine: {
        running: boolean;
        cycles: number;
        evolving: boolean;
    };
    manifest: {
        version: string;
        objectives: string[];
        lastEvolution: { cycle: number; analysis: string; changedFiles: string[]; timestamp: string } | null;
        totalEvolutions: number;
    };
    telemetry: TelemetryEntry[];
}

// ─── Mini Sparkline ──────────────────────────────────────────
function Sparkline({ data, max, color = '#6366f1' }: { data: number[]; max: number; color?: string }) {
    if (!data.length) return <div className="h-10 opacity-30 text-xs text-gray-400 flex items-center">No data</div>;
    const w = 120;
    const h = 40;
    const step = w / Math.max(data.length - 1, 1);
    const points = data
        .map((v, i) => `${i * step},${h - (v / max) * h}`)
        .join(' ');

    return (
        <svg width={w} height={h} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_4px_rgba(99,102,241,0.8)]"
            />
            {data.map((v, i) => (
                <circle key={i} cx={i * step} cy={h - (v / max) * h} r={2} fill={color} />
            ))}
        </svg>
    );
}

// ─── Pulse Dot ───────────────────────────────────────────────
function PulseDot({ active, evolving }: { active: boolean; evolving: boolean }) {
    const color = evolving ? 'bg-amber-400' : active ? 'bg-emerald-400' : 'bg-gray-500';
    return (
        <span className="relative flex h-3 w-3">
            {(active || evolving) && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
        </span>
    );
}

// ─── Main Component ──────────────────────────────────────────
export default function EvolutionMonitor() {
    const [status, setStatus] = useState<EngineStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStatus = useCallback(async (showLoader = false) => {
        if (showLoader) setIsRefreshing(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/evolution/status`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: EngineStatus = await res.json();
            setStatus(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to reach backend');
        } finally {
            if (showLoader) setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const id = setInterval(() => fetchStatus(), POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [fetchStatus]);

    const heapData = status?.telemetry.map(t => t.heapUsedMB) ?? [];
    const latencyData = status?.telemetry.map(t => t.apiLatencyMs ?? 0) ?? [];
    const maxHeap = Math.max(...heapData, 100);
    const maxLatency = Math.max(...latencyData, 2000);
    const { running = false, cycles = 0, evolving = false } = status?.engine ?? {};
    const { version = '—', totalEvolutions = 0, lastEvolution = null } = status?.manifest ?? {};

    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
            {/* ── Header ── */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        <Zap size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Evolution Engine</h3>
                        <p className="text-gray-400 text-xs">Mission Manifest v{version}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <PulseDot active={running} evolving={evolving} />
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${evolving
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : running
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}>
                        {evolving ? 'EVOLVING' : running ? 'ONLINE' : 'STANDBY'}
                    </span>
                    <button
                        onClick={() => fetchStatus(true)}
                        disabled={isRefreshing}
                        aria-label="Refresh evolution status"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="mx-4 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-xs">{error}</span>
                </div>
            )}

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-xl bg-white/5 border border-white/8 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={12} className="text-indigo-400" />
                        <span className="text-gray-400 text-xs">Total Cycles</span>
                    </div>
                    <p className="text-white text-2xl font-bold">{cycles}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{totalEvolutions} evolutions</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/8 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={12} className="text-emerald-400" />
                        <span className="text-gray-400 text-xs">Heap Memory</span>
                    </div>
                    <p className="text-white text-2xl font-bold">
                        {heapData.at(-1) ?? '—'}<span className="text-sm text-gray-400 font-normal"> MB</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">512 MB warning threshold</p>
                </div>
            </div>

            {/* ── Sparklines ── */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                <div className="rounded-xl bg-white/5 border border-white/8 p-4">
                    <p className="text-gray-400 text-xs mb-3">Heap Usage</p>
                    <Sparkline data={heapData} max={maxHeap} color="#6366f1" />
                </div>
                <div className="rounded-xl bg-white/5 border border-white/8 p-4">
                    <p className="text-gray-400 text-xs mb-3">API Latency (ms)</p>
                    <Sparkline
                        data={latencyData}
                        max={maxLatency}
                        color={latencyData.at(-1) ?? 0 > 2000 ? '#f87171' : '#34d399'}
                    />
                </div>
            </div>

            {/* ── Last Evolution ── */}
            {lastEvolution && (
                <div className="mx-4 mb-4 rounded-xl bg-white/5 border border-white/8 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={12} className="text-emerald-400" />
                        <span className="text-gray-400 text-xs">Last Evolution — Cycle #{lastEvolution.cycle}</span>
                    </div>
                    <p className="text-white/80 text-xs leading-relaxed">{lastEvolution.analysis}</p>
                    {lastEvolution.changedFiles?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {lastEvolution.changedFiles.map(f => (
                                <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-mono">
                                    {f.split('/').pop()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <Clock size={11} />
                    <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}</span>
                </div>
                <span className="text-gray-600 text-[10px]">Polls every 10s</span>
            </div>
        </div>
    );
}
