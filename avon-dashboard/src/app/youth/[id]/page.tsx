import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

// Mock Supabase Client if not available globally
// In real app, import { supabase } from '@/lib/supabase'

// Define Types
type YouthProfile = {
    id: string;
    name: string;
    age: number;
    city: string;
    skills: string[];
    fight_stats: any;
    accomplishments: string[];
    avatar_url?: string;
};

type YouthEvent = {
    id: string;
    title: string;
    event_date: string;
    description: string;
};

// Next.js 15 Async Component
export default async function YouthProfilePage({ params }: { params: { id: string } }) {
    const { id } = await params;

    // Fetch Data (using fetch for simplicity or simulate DB call)
    // Here we simulate a fetch or use an imported client if structured.
    // For LocalCodeBuilder, I'll write a mock fetcher to guarantee it works without DB setup.

    // Real Implementation:
    // const { data: profile } = await supabase.from('profiles_youth').select('*').eq('id', id).single();

    // Mock Implementation for Prototype:
    const profile: YouthProfile = {
        id,
        name: "Alex 'The Striker' Johnson",
        age: 17,
        city: "Philadelphia, PA",
        skills: ["Boxing", "Muay Thai", "Discipline", "Leadership"],
        fight_stats: { wins: 12, losses: 2, knockouts: 5 },
        accomplishments: ["Golden Gloves Finalist 2025", "Community Hero Award"],
        avatar_url: "https://image.pollinations.ai/prompt/young%20boxer%20portrait?width=300&height=300&nologo=true"
    };

    const events: YouthEvent[] = [
        { id: 'e1', title: 'Regional Championship', event_date: '2025-11-15', description: 'Competing for the state title.' },
        { id: 'e2', title: 'Charity Sparring Event', event_date: '2025-12-01', description: 'Raising funds for local gym equipment.' }
    ];

    if (!profile) return notFound();

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header / Profile Card */}
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl">
                    <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-48 h-48 rounded-full object-cover border-4 border-blue-600 shadow-lg"
                    />
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                {profile.name}
                            </h1>
                            <p className="text-neutral-400 font-mono text-sm mt-1">{profile.city} • Age {profile.age}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {profile.skills.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-black/50 p-4 rounded-xl border border-neutral-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-500">{profile.fight_stats.wins}</p>
                                <p className="text-[10px] uppercase text-neutral-500 font-bold">Wins</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{profile.fight_stats.losses}</p>
                                <p className="text-[10px] uppercase text-neutral-500 font-bold">Losses</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-500">{profile.fight_stats.knockouts}</p>
                                <p className="text-[10px] uppercase text-neutral-500 font-bold">KOs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accomplishments */}
                <section>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Accomplishments
                    </h2>
                    <ul className="space-y-3">
                        {profile.accomplishments.map((acc, i) => (
                            <li key={i} className="flex items-center gap-3 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 hover:border-blue-600/30 transition-colors">
                                <span className="text-yellow-500">🏆</span>
                                <span className="font-semibold text-neutral-200">{acc}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Upcoming Events */}
                <section>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span> Upcoming Events
                    </h2>
                    <div className="grid gap-4">
                        {events.map(event => (
                            <div key={event.id} className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 hover:bg-neutral-800/80 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{event.title}</h3>
                                    <span className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs font-mono rounded">{event.event_date}</span>
                                </div>
                                <p className="text-neutral-400 text-sm leading-relaxed">{event.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
