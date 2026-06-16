-- ═══════════════════════════════════════════════════════
--  FOCUSFLOW — SUPABASE POSTGRESQL SCHEMA
--  Run this in Supabase SQL Editor → New Query
--  Everything here is FREE on Supabase free tier
-- ═══════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search on journals

-- ── PROFILES ────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email             TEXT NOT NULL,
  full_name         TEXT NOT NULL DEFAULT '',
  avatar_url        TEXT,
  xp                INTEGER NOT NULL DEFAULT 0,
  level             INTEGER NOT NULL DEFAULT 1,
  streak            INTEGER NOT NULL DEFAULT 0,
  best_streak       INTEGER NOT NULL DEFAULT 0,
  preferences       JSONB NOT NULL DEFAULT '{
    "dark_mode": false,
    "notifications_enabled": true,
    "focus_reminder_time": "09:00",
    "reflection_reminder_time": "21:00",
    "daily_focus_goal_minutes": 120
  }'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── FOCUS SESSIONS ──────────────────────────────────────
CREATE TABLE public.focus_sessions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mode             TEXT NOT NULL CHECK (mode IN ('pomodoro','deep_work','custom')),
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  focus_score      INTEGER CHECK (focus_score BETWEEN 0 AND 100),
  sound_used       TEXT,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  notes            TEXT
);

CREATE INDEX idx_focus_sessions_user_date
  ON public.focus_sessions(user_id, started_at DESC);

-- ── REFLECTIONS (JOURNAL) ───────────────────────────────
CREATE TABLE public.reflections (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date               DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score         INTEGER NOT NULL CHECK (mood_score BETWEEN 0 AND 4),
  energy_level       INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  productive         TEXT NOT NULL DEFAULT '',
  improved           TEXT NOT NULL DEFAULT '',
  tomorrow           TEXT NOT NULL DEFAULT '',
  stress_trigger     TEXT NOT NULL DEFAULT '',
  grateful           TEXT NOT NULL DEFAULT '',
  overall_score      INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  -- ML fields populated by backend
  sentiment_score    NUMERIC(4,2),
  detected_triggers  TEXT[] DEFAULT '{}',
  positive_signals   INTEGER DEFAULT 0,
  negative_signals   INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_reflections_user_date ON public.reflections(user_id, date DESC);
-- Full-text search across all journal fields
CREATE INDEX idx_reflections_fts ON public.reflections
  USING GIN(to_tsvector('english', productive || ' ' || improved || ' ' || stress_trigger || ' ' || grateful));

-- ── HABITS ──────────────────────────────────────────────
CREATE TABLE public.habits (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  emoji          TEXT NOT NULL DEFAULT '✅',
  color          TEXT NOT NULL DEFAULT '#7F77DD',
  frequency      TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekdays','weekends')),
  reminder_time  TIME,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.habit_logs (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id     UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_logs_user_date ON public.habit_logs(user_id, date DESC);

-- ── MOOD LOGS ───────────────────────────────────────────
CREATE TABLE public.mood_logs (
  id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score     INTEGER NOT NULL CHECK (score BETWEEN 0 AND 4),
  label     TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_logs_user ON public.mood_logs(user_id, logged_at DESC);

-- ── ML INSIGHTS ─────────────────────────────────────────
CREATE TABLE public.ml_insights (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('pattern','trend','anomaly','sentiment','recommendation')),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  confidence    INTEGER NOT NULL DEFAULT 80,
  color         TEXT NOT NULL DEFAULT '#7F77DD',
  emoji         TEXT NOT NULL DEFAULT '🧠',
  data_snapshot JSONB DEFAULT '{}',
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_insights_user ON public.ml_insights(user_id, generated_at DESC);

-- ── ACHIEVEMENTS ────────────────────────────────────────
CREATE TABLE public.achievements (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  xp_awarded      INTEGER NOT NULL DEFAULT 0,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- ── STREAKS ─────────────────────────────────────────────
CREATE TABLE public.streaks (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('focus','reflection','habit')),
  current       INTEGER NOT NULL DEFAULT 0,
  best          INTEGER NOT NULL DEFAULT 0,
  last_activity DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, type)
);

-- ── SCREEN TIME LOGS ────────────────────────────────────
CREATE TABLE public.screen_time_logs (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  app_breakdown JSONB DEFAULT '{}',
  UNIQUE(user_id, date)
);

-- ═══════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) — users only see their data
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_time_logs ENABLE ROW LEVEL SECURITY;

-- Policies: each user can only CRUD their own rows
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','focus_sessions','reflections','habits',
    'habit_logs','mood_logs','ml_insights','achievements',
    'streaks','screen_time_logs'
  ]
  LOOP
    EXECUTE format('
      CREATE POLICY "%s_own_rows" ON public.%s
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    ', tbl, tbl);
  END LOOP;
END;
$$;

-- Profiles: user can read/update own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════
--  STORED FUNCTIONS (called from app)
-- ═══════════════════════════════════════════════════════

-- Award XP and level up automatically
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_xp INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_xp    INTEGER;
  v_level INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE public.profiles
  SET xp = xp + p_xp
  WHERE id = p_user_id
  RETURNING xp, level INTO v_xp, v_level;

  v_new_level := GREATEST(1, FLOOR(v_xp / 500) + 1);

  IF v_new_level > v_level THEN
    UPDATE public.profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_xp, v_new_level, (v_new_level > v_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get weekly summary for ML
CREATE OR REPLACE FUNCTION get_weekly_ml_data(p_user_id UUID, p_weeks INTEGER DEFAULT 8)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'focus_sessions', (
        SELECT json_agg(json_build_object(
          'date', started_at::DATE,
          'score', focus_score,
          'duration', duration_minutes,
          'completed', completed
        ))
        FROM public.focus_sessions
        WHERE user_id = p_user_id
          AND started_at >= NOW() - (p_weeks || ' weeks')::INTERVAL
      ),
      'reflections', (
        SELECT json_agg(json_build_object(
          'date', date,
          'mood', mood_score,
          'energy', energy_level,
          'sentiment', sentiment_score
        ))
        FROM public.reflections
        WHERE user_id = p_user_id
          AND date >= CURRENT_DATE - (p_weeks * 7)
      ),
      'habit_completion', (
        SELECT json_agg(json_build_object(
          'date', date,
          'count', cnt
        ))
        FROM (
          SELECT date, COUNT(*) as cnt
          FROM public.habit_logs
          WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - (p_weeks * 7)
          GROUP BY date
        ) sub
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
--  SEED DEFAULT HABITS for new users
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION seed_default_habits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.habits (user_id, name, emoji, color, sort_order) VALUES
    (p_user_id, 'Morning meditation',  '🧘', '#7F77DD', 1),
    (p_user_id, 'No phone first hour', '📵', '#1D9E75', 2),
    (p_user_id, 'Evening journal',     '✍️', '#D85A30', 3),
    (p_user_id, 'Deep work block',     '🎯', '#D4537E', 4),
    (p_user_id, '7+ hours sleep',      '😴', '#6C5FE6', 5);

  INSERT INTO public.streaks (user_id, type) VALUES
    (p_user_id, 'focus'),
    (p_user_id, 'reflection'),
    (p_user_id, 'habit');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call seed when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_habits(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
