-- Migration: Add learner_profiles table and link account_cards
-- Date: 2026-02-21
-- Description: Introduces multi-profile support. Each account can have multiple
--   learner profiles. All learning data (account_cards, review_history, stats)
--   will be scoped to a profile instead of directly to an account.

-- 1. Create learner_profiles table
CREATE TABLE IF NOT EXISTS public.learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '我',
  avatar_index int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, name)
);

ALTER TABLE public.learner_profiles OWNER TO postgres;
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_learner_profiles_account ON public.learner_profiles(account_id);

-- RLS: users can only access their own profiles
CREATE POLICY "Users can view own profiles"
  ON public.learner_profiles FOR SELECT
  USING (account_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profiles"
  ON public.learner_profiles FOR INSERT
  WITH CHECK (account_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profiles"
  ON public.learner_profiles FOR UPDATE
  USING (account_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profiles"
  ON public.learner_profiles FOR DELETE
  USING (account_id = (SELECT auth.uid()) AND is_default = false);

-- 2. Backfill: create a default profile for every existing account
INSERT INTO public.learner_profiles (account_id, name, is_default)
SELECT id, '我', true
FROM public.accounts
ON CONFLICT (account_id, name) DO NOTHING;

-- 3. Add profile_id column to account_cards (nullable first for backfill)
ALTER TABLE public.account_cards
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.learner_profiles(id) ON DELETE CASCADE;

-- 4. Backfill: set profile_id on existing account_cards
UPDATE public.account_cards ac
SET profile_id = lp.id
FROM public.learner_profiles lp
WHERE lp.account_id = ac.account_id
  AND lp.is_default = true
  AND ac.profile_id IS NULL;

-- 5. Make profile_id NOT NULL after backfill
ALTER TABLE public.account_cards
  ALTER COLUMN profile_id SET NOT NULL;

-- 6. Add index on profile_id
CREATE INDEX idx_account_cards_profile ON public.account_cards(profile_id);
CREATE INDEX idx_account_cards_profile_review ON public.account_cards(profile_id, next_review_date);

-- 7. Update unique constraint: from (account_id, knowledge_code, card_type_code)
--    to (profile_id, knowledge_code, card_type_code)
ALTER TABLE public.account_cards
  DROP CONSTRAINT IF EXISTS account_cards_account_id_knowledge_code_card_type_code_key;

ALTER TABLE public.account_cards
  ADD CONSTRAINT account_cards_profile_knowledge_card_type_key
  UNIQUE (profile_id, knowledge_code, card_type_code);

-- 8. Add plan column to accounts for profile limit enforcement
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

-- 9. Update give_cards_to_new_user trigger to also create default profile
CREATE OR REPLACE FUNCTION public.give_cards_to_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF (new.raw_app_meta_data->>'role') = 'operator' THEN
    RETURN new;
  END IF;

  INSERT INTO public.accounts (id, username)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  -- Create default learner profile
  INSERT INTO public.learner_profiles (account_id, name, is_default)
  VALUES (new.id, '我', true)
  ON CONFLICT (account_id, name) DO NOTHING
  RETURNING id INTO v_profile_id;

  -- If profile already existed (conflict), fetch its id
  IF v_profile_id IS NULL THEN
    SELECT id INTO v_profile_id
    FROM public.learner_profiles
    WHERE account_id = new.id AND is_default = true;
  END IF;

  INSERT INTO public.account_cards (
    account_id, profile_id, knowledge_code, card_type_code,
    ease_factor, interval_days, repetitions, next_review_date
  )
  SELECT
    new.id,
    v_profile_id,
    k.code,
    'basic-front-back',
    2.50, 0, 0,
    now()
  FROM public.knowledge k
  ON CONFLICT (profile_id, knowledge_code, card_type_code) DO NOTHING;

  RETURN new;
END;
$$;

-- 10. Profile count limit function (for API layer to call)
CREATE OR REPLACE FUNCTION public.get_profile_limit(p_plan text)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_plan = 'pro' THEN 10
    ELSE 2
  END;
$$;

GRANT ALL ON TABLE public.learner_profiles TO postgres;
GRANT ALL ON TABLE public.learner_profiles TO anon;
GRANT ALL ON TABLE public.learner_profiles TO authenticated;
GRANT ALL ON TABLE public.learner_profiles TO service_role;

GRANT ALL ON FUNCTION public.get_profile_limit(text) TO authenticated;
GRANT ALL ON FUNCTION public.get_profile_limit(text) TO service_role;
