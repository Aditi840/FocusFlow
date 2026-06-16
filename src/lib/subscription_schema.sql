-- Add to schema.sql — run in Supabase SQL Editor

CREATE TABLE public.subscriptions (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_premium           BOOLEAN NOT NULL DEFAULT FALSE,
  plan                 TEXT DEFAULT '6_months_99',
  razorpay_payment_id  TEXT,
  started_at           TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,
  trial_start          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create subscription row (starts trial) when profile created
CREATE OR REPLACE FUNCTION seed_subscription(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, trial_start)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook it into existing profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_habits(NEW.id);
  PERFORM seed_subscription(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
