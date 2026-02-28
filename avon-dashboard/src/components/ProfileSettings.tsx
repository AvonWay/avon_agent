"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, CreditCard, Shield, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfileSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setProfile(data);
            }
        } catch (error: any) {
            console.error('Error loading profile:', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const updates = {
                id: user.id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setSaving(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile({ ...profile, avatar_url: publicUrl });

            // Also update the table immediately
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

            setMessage({ type: 'success', text: 'Avatar updated!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function resendVerification() {
        try {
            setSaving(true);
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Verification email sent!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function handleBilling() {
        try {
            setSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500">Manage your account settings and subscription.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Information */}
                <div className="md:col-span-2 space-y-8">
                    <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Personal Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    title="Full Name"
                                    value={profile?.full_name || ''}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        title="Email Address"
                                        value={user?.email || ''}
                                        disabled
                                        className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                        placeholder="your@email.com"
                                    />
                                    {user?.email_confirmed_at ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs font-bold">
                                            <CheckCircle size={14} />
                                            VERIFIED
                                        </div>
                                    ) : (
                                        <button
                                            onClick={resendVerification}
                                            disabled={saving}
                                            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold hover:bg-amber-100 transition-colors"
                                        >
                                            VERIFY NOW
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={updateProfile}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </section>

                    <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <CreditCard size={20} className="text-blue-600" />
                            Subscription Plan
                        </h2>

                        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Plan</p>
                                <p className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    {profile?.subscription_status === 'active' ? 'Velocity Professional' : 'Free Tier'}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${profile?.subscription_status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {profile?.subscription_status?.toUpperCase() || 'NONE'}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={handleBilling}
                                disabled={saving}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                Manage Billing
                            </button>

                        </div>

                        <div className="mt-4 p-4 border border-dashed border-blue-200 rounded-xl bg-blue-50/30">
                            <p className="text-sm text-blue-800">
                                <strong>Pro Tip:</strong> Professional accounts get 24/7 Swarm Mode priority and custom domain support.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Sidebar / Photo */}
                <div className="space-y-8">
                    <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo</label>
                        <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4 mx-auto">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-4 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-all border-2 border-white">
                                <Camera size={16} />
                                <input
                                    type="file"
                                    title="Upload Avatar"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={saving}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </section>

                    <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Shield size={16} className="text-blue-600" />
                            Account Security
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">2FA Status</span>
                                <span className="text-red-500 font-bold text-xs">Disabled</span>
                            </li>
                            <li className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Last Login</span>
                                <span className="text-gray-500 text-xs">Today</span>
                            </li>
                        </ul>
                        <button className="w-full mt-6 py-2 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all">
                            Change Password
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
