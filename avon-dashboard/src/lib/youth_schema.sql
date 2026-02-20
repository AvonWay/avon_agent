-- Migration for Youth Profile Management
-- Run this in your Supabase SQL Editor to enable the feature.

CREATE TABLE IF NOT EXISTS public.profiles_youth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT,
  skills TEXT[] DEFAULT '{}',
  fight_stats JSONB DEFAULT '{}'::jsonb,
  accomplishments TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events_youth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles_youth(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles_youth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_youth ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for prototype)
-- Anyone can read
CREATE POLICY "Public Read Access" ON public.profiles_youth FOR SELECT USING (true);
CREATE POLICY "Public Read Access Events" ON public.events_youth FOR SELECT USING (true);

-- Authenticated users can write (assuming 'authenticated' role means Admin here)
CREATE POLICY "Auth Write Access" ON public.profiles_youth FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON public.profiles_youth FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON public.profiles_youth FOR DELETE USING (auth.role() = 'authenticated');
