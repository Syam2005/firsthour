-- FirstHour Supabase Schema
-- Run this in the Supabase SQL editor: https://app.supabase.com/project/_/sql

-- Users table (created on first GitHub login)
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id  TEXT UNIQUE NOT NULL,
  login      TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analysis runs
CREATE TABLE IF NOT EXISTS public.runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source       TEXT NOT NULL CHECK (source IN ('github', 'upload')),
  source_label TEXT NOT NULL,
  source_url   TEXT,
  status       TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'error')),
  summary      TEXT,
  result_json  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS runs_user_id_idx ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS runs_created_at_idx ON public.runs(created_at DESC);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- RLS: service role (backend) can do everything
-- The backend uses SUPABASE_SECRET_KEY (service role key) which bypasses RLS
-- No anon or user-level policies needed since frontend never calls Supabase directly
