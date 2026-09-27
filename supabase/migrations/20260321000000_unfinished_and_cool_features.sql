-- =============================================================================
-- OTAKUVERSE — Unfinished Items & Cool Features Migration
-- Apply this to YOUR Supabase project via SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Watchlist Entries (Anime / Manga tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('anime', 'manga')),
  status text NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold')),
  progress_count integer NOT NULL DEFAULT 0 CHECK (progress_count >= 0),
  total_count integer CHECK (total_count IS NULL OR total_count >= 0),
  score numeric(3,1) CHECK (score IS NULL OR (score >= 0.0 AND score <= 10.0)),
  cover_image text,
  anilist_id integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, media_type, title)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_type ON public.watchlist_entries (media_type);

ALTER TABLE public.watchlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist_read_all" ON public.watchlist_entries;
CREATE POLICY "watchlist_read_all" ON public.watchlist_entries
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "watchlist_owner_all" ON public.watchlist_entries;
CREATE POLICY "watchlist_owner_all" ON public.watchlist_entries
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. Avatar Frames & Profile Extensions
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_frame text DEFAULT 'none';

-- -----------------------------------------------------------------------------
-- 3. Badges and Achievements Seed Data
-- -----------------------------------------------------------------------------
INSERT INTO public.badges (code, name, description, icon) VALUES
  ('pioneer', 'Pioneer', 'Joined during the early phase of OTAKUVERSE.', '⚡'),
  ('speedrunner', 'Speedrunner', 'Logged over 50 completed series on their watchlist.', '🏃'),
  ('socialite', 'Socialite', 'Connected with 10+ followers in the verse.', '🌐'),
  ('globe_trotter', 'Globe Trotter', 'Explored geography across continents.', '🗺️'),
  ('community_hero', 'Community Hero', 'Active contributor in multiple communities.', '🏆')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

INSERT INTO public.achievements (code, name, description, xp_reward) VALUES
  ('first_post', 'First Signal', 'Published your first post on the feed.', 50),
  ('watchlist_starter', 'Otaku Scholar', 'Added 5 items to your anime/manga watchlist.', 100),
  ('level_5', 'Aura Rising', 'Reached Level 5 on OTAKUVERSE.', 200),
  ('level_10', 'Over 9000', 'Reached Level 10 on OTAKUVERSE.', 500)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward;

-- -----------------------------------------------------------------------------
-- 4. Leaderboard RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(result_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_frame text,
  country_code text,
  xp integer,
  level integer,
  reputation integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.avatar_frame,
    p.country_code,
    p.xp,
    p.level,
    p.reputation
  FROM public.profiles p
  WHERE p.moderation_status = 'active'
  ORDER BY p.xp DESC, p.reputation DESC
  LIMIT LEAST(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(integer) TO anon, authenticated;
