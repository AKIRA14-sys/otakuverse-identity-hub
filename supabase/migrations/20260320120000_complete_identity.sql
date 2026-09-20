-- =============================================================================
-- OTAKUVERSE SPACE 1 — Identity foundation
-- Apply this to YOUR own Supabase project (SQL Editor or CLI).
-- Never put the service_role key in frontend code.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Geography reference tables (seed lightly; expand later)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.continents (
  code text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY,                 -- ISO 3166-1 alpha-2
  name text NOT NULL,
  dial text NOT NULL,                    -- e.g. +81
  flag text,
  continent_code text REFERENCES public.continents (code)
);

CREATE TABLE IF NOT EXISTS public.states_provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES public.countries (code) ON DELETE CASCADE,
  name text NOT NULL,
  code text
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES public.countries (code) ON DELETE CASCADE,
  state_id uuid REFERENCES public.states_provinces (id) ON DELETE SET NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.local_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_states_country ON public.states_provinces (country_code);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities (country_code);
CREATE INDEX IF NOT EXISTS idx_cities_state ON public.cities (state_id);
CREATE INDEX IF NOT EXISTS idx_local_areas_city ON public.local_areas (city_id);

-- Minimal continent / country seeds (app also ships a full client-side country list)
INSERT INTO public.continents (code, name) VALUES
  ('AF', 'Africa'),
  ('AN', 'Antarctica'),
  ('AS', 'Asia'),
  ('EU', 'Europe'),
  ('NA', 'North America'),
  ('OC', 'Oceania'),
  ('SA', 'South America')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- id = auth.users.id — permanent primary identity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,

  username text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,

  -- Private by default (never exposed via public_profiles)
  email text,
  phone_e164 text,
  date_of_birth date,

  gender text CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say')),

  continent_code text REFERENCES public.continents (code),
  -- country_code uses ISO alpha-2; full country list lives in the app client.
  -- FK to public.countries is optional so signup works before full seed.
  country_code text,
  state_id uuid REFERENCES public.states_provinces (id),
  city_id uuid REFERENCES public.cities (id),
  local_area_id uuid REFERENCES public.local_areas (id),

  favorite_anime text[] NOT NULL DEFAULT '{}',
  favorite_characters text[] NOT NULL DEFAULT '{}',
  favorite_genres text[] NOT NULL DEFAULT '{}',
  anime_watchlist text[] NOT NULL DEFAULT '{}',
  manga_list text[] NOT NULL DEFAULT '{}',

  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  reputation integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
  following_count integer NOT NULL DEFAULT 0 CHECK (following_count >= 0),

  -- Prepared for future admin / moderation (never client-writable)
  is_admin boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  moderation_status text NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active', 'restricted', 'suspended', 'banned')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_username_format CHECK (
    username ~ '^[a-z0-9_]{3,24}$'
  )
);

-- Username uniqueness (normalized lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username));

CREATE INDEX IF NOT EXISTS profiles_country_idx ON public.profiles (country_code);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at DESC);

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile from auth.users + raw_user_meta_data (signup)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_display text;
  v_country text;
  v_phone text;
  v_dob date;
  v_gender text;
BEGIN
  v_username := lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')));
  v_display := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'display_name', v_username)), '');
  v_country := NULLIF(upper(trim(COALESCE(NEW.raw_user_meta_data->>'country_code', ''))), '');
  v_phone := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone_e164', '')), '');
  BEGIN
    v_dob := (NEW.raw_user_meta_data->>'date_of_birth')::date;
  EXCEPTION WHEN others THEN
    v_dob := NULL;
  END;
  v_gender := NULLIF(lower(trim(COALESCE(NEW.raw_user_meta_data->>'gender', ''))), '');
  IF v_gender IS NOT NULL AND v_gender NOT IN ('male', 'female', 'prefer_not_to_say') THEN
    v_gender := NULL;
  END IF;

  -- Fallback unique-ish username if missing (should not happen with app validation)
  IF v_username IS NULL OR v_username = '' OR length(v_username) < 3 THEN
    v_username := 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    email,
    phone_e164,
    date_of_birth,
    gender,
    country_code
  ) VALUES (
    NEW.id,
    v_username,
    v_display,
    NEW.email,
    v_phone,
    v_dob,
    v_gender,
    v_country
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RPC: is_username_available
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_username_available(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  norm := lower(trim(COALESCE(candidate, '')));
  IF norm = '' OR length(norm) < 3 OR length(norm) > 24 THEN
    RETURN false;
  END IF;
  IF norm !~ '^[a-z0-9_]+$' THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE lower(p.username) = norm
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- RPC: get_my_profile (own row, includes private fields)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT *
  FROM public.profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- -----------------------------------------------------------------------------
-- Public profiles view — NO private email / phone / exact DOB
-- Age is derived server-side only when DOB is present
-- -----------------------------------------------------------------------------
-- View owner is the migration role. security_invoker = false so the view can
-- read all active profiles while exposing ONLY public columns.
-- Do NOT use security_invoker = true: profiles RLS only allows SELECT of the
-- caller's own row, which would hide every other public profile.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.gender,
  p.continent_code,
  p.country_code,
  p.city_id,
  CASE
    WHEN p.date_of_birth IS NULL THEN NULL
    ELSE (
      EXTRACT(YEAR FROM age(current_date, p.date_of_birth))::integer
    )
  END AS age,
  p.favorite_anime,
  p.favorite_characters,
  p.favorite_genres,
  p.anime_watchlist,
  p.manga_list,
  p.xp,
  p.level,
  p.reputation,
  p.follower_count,
  p.following_count,
  p.created_at
FROM public.profiles p
WHERE p.moderation_status = 'active';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Geography: public read
DROP POLICY IF EXISTS "continents_read_all" ON public.continents;
CREATE POLICY "continents_read_all" ON public.continents
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "countries_read_all" ON public.countries;
CREATE POLICY "countries_read_all" ON public.countries
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "states_read_all" ON public.states_provinces;
CREATE POLICY "states_read_all" ON public.states_provinces
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cities_read_all" ON public.cities;
CREATE POLICY "cities_read_all" ON public.cities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "local_areas_read_all" ON public.local_areas;
CREATE POLICY "local_areas_read_all" ON public.local_areas
  FOR SELECT TO anon, authenticated USING (true);

-- Profiles: owner can SELECT own full row
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Profiles: owner can UPDATE only permitted columns (enforced by column grants + trigger)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No direct INSERT from clients (trigger owns creation)
-- No DELETE from clients

-- Guard: strip privileged fields on update
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Identity & system fields immutable by clients
  NEW.id := OLD.id;
  NEW.username := OLD.username;          -- username changes can be allowed later via RPC
  NEW.email := OLD.email;
  NEW.phone_e164 := OLD.phone_e164;
  NEW.date_of_birth := OLD.date_of_birth;
  NEW.xp := OLD.xp;
  NEW.level := OLD.level;
  NEW.reputation := OLD.reputation;
  NEW.follower_count := OLD.follower_count;
  NEW.following_count := OLD.following_count;
  NEW.is_admin := OLD.is_admin;
  NEW.is_verified := OLD.is_verified;
  NEW.moderation_status := OLD.moderation_status;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_update ON public.profiles;
CREATE TRIGGER profiles_guard_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_update();

-- Column-level: authenticated can update only safe columns
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  display_name,
  avatar_url,
  bio,
  gender,
  continent_code,
  country_code,
  state_id,
  city_id,
  local_area_id,
  favorite_anime,
  favorite_characters,
  favorite_genres,
  anime_watchlist,
  manga_list
) ON public.profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- Badges / achievements stubs (for future spaces; schema ready)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text
);

CREATE TABLE IF NOT EXISTS public.achievements (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  xp_reward integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_code text NOT NULL REFERENCES public.badges (code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_code)
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  achievement_code text NOT NULL REFERENCES public.achievements (code) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_code)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_read" ON public.badges;
CREATE POLICY "badges_read" ON public.badges FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "achievements_read" ON public.achievements;
CREATE POLICY "achievements_read" ON public.achievements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_badges_read" ON public.user_badges;
CREATE POLICY "user_badges_read" ON public.user_badges FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_achievements_read" ON public.user_achievements;
CREATE POLICY "user_achievements_read" ON public.user_achievements FOR SELECT TO anon, authenticated USING (true);
