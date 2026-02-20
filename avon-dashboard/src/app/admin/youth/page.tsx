'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // Mock import if not configured

// Type Definitions
type Profile = {
    id: string;
    name: string;
    age: number;
    city: string;
    skills: string[];
    fight_stats: { wins: number, losses: number, knockouts: number };
};

export default function AdminYouthPage() {
    const [profiles, setProfiles] = useState<Profile[]>([
        { id: '1', name: 'Alex Johnson', age: 17, city: 'Philly', skills: ['Boxing'], fight_stats: { wins: 12, losses: 2, knockouts: 5 } }
    ]);

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        city: '',
        skills: '',
        wins: 0,
        losses: 0,
        knockouts: 0
    });

    const [loading, setLoading] = useState(false);

    // Mock Fetch
    useEffect(() => {
        // async function fetchProfiles() {
        //   const { data, error } = await supabase.from('profiles_youth').select('*');
        //   if (data) setProfiles(data);
        // }
        // fetchProfiles();
        console.log("Fetching profiles from DB...");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newProfile: Profile = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            age: parseInt(formData.age),
            city: formData.city,
            skills: formData.skills.split(',').map(s => s.trim()),
            fight_stats: {
                wins: formData.wins,
                losses: formData.losses,
                knockouts: formData.knockouts
            }
        };

        // Simulate Network Request
        setTimeout(() => {
            setProfiles([...profiles, newProfile]);
            setLoading(false);
            setFormData({ name: '', age: '', city: '', skills: '', wins: 0, losses: 0, knockouts: 0 });
            alert("Profile Created Successfully!");
            // Real Apps: await supabase.from('profiles_youth').insert(newProfile);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Create Profile Form */}
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 text-blue-400 uppercase tracking-widest">Create Youth Profile</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="full-name" className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input
                                    id="full-name"
                                    type="text"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                <input
                                    id="city"
                                    type="text"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="age" className="block text-xs font-bold text-gray-500 uppercase mb-1">Age</label>
                                <input
                                    id="age"
                                    type="number"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="skills" className="block text-xs font-bold text-gray-500 uppercase mb-1">Skills (comma separated)</label>
                                <input
                                    id="skills"
                                    type="text"
                                    placeholder="Boxing, Wrestling"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition"
                                    value={formData.skills}
                                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Fight Stats</label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="wins" className="block text-xs text-green-500">Wins</label>
                                    <input id="wins" type="number" className="w-full bg-gray-800 p-2 rounded text-white" value={formData.wins} onChange={e => setFormData({ ...formData, wins: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label htmlFor="losses" className="block text-xs text-red-500">Losses</label>
                                    <input id="losses" type="number" className="w-full bg-gray-800 p-2 rounded text-white" value={formData.losses} onChange={e => setFormData({ ...formData, losses: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label htmlFor="knockouts" className="block text-xs text-yellow-500">KOs</label>
                                    <input id="knockouts" type="number" className="w-full bg-gray-800 p-2 rounded text-white" value={formData.knockouts} onChange={e => setFormData({ ...formData, knockouts: parseInt(e.target.value) })} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Profile'}
                        </button>
                    </form>
                </div>

                {/* Existing Profiles List */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-400 uppercase tracking-widest">Active Profiles</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {profiles.map(profile => (
                            <div key={profile.id} className="p-6 bg-gray-800 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{profile.name} <span className="text-gray-500 text-sm font-normal">({profile.age})</span></h3>
                                    <p className="text-gray-400 text-sm">{profile.city}</p>
                                    <div className="flex gap-2 mt-2">
                                        {profile.skills.slice(0, 3).map(s => <span key={s} className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">{s}</span>)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-500">{profile.fight_stats.wins}W</p>
                                    <p className="text-sm text-red-500">{profile.fight_stats.losses}L</p>
                                    <a href={`/youth/${profile.id}`} className="mt-2 inline-block text-xs text-blue-400 hover:underline">View Public →</a>
                                </div>
                            </div>
                        ))}
                        {profiles.length === 0 && <p className="text-gray-500 italic">No profiles found.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
}
