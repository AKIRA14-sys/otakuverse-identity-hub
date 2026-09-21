-- =============================================================================
-- OTAKUVERSE SPACE 2 — WORLD
-- Additive migration on top of Space 1. Review/run manually — do not auto-apply.
-- Does NOT drop profiles, auth, or existing geography tables.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Region centroids for map panels only (never user GPS)
ALTER TABLE public.continents
  ADD COLUMN IF NOT EXISTS member_count_cached integer NOT NULL DEFAULT 0;

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS member_count_cached integer NOT NULL DEFAULT 0;

ALTER TABLE public.states_provinces
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS member_count_cached integer NOT NULL DEFAULT 0;

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS member_count_cached integer NOT NULL DEFAULT 0;

ALTER TABLE public.local_areas
  ADD COLUMN IF NOT EXISTS member_count_cached integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_countries_name_trgm ON public.countries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_countries_code_lower ON public.countries (lower(code));
CREATE INDEX IF NOT EXISTS idx_states_name_trgm ON public.states_provinces USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm ON public.cities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_local_areas_name_trgm ON public.local_areas USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_continents_name_lower ON public.continents (lower(name));
CREATE INDEX IF NOT EXISTS idx_profiles_continent ON public.profiles (continent_code);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles (state_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles (city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_local_area ON public.profiles (local_area_id);

-- Modest real-country seed (not a full world dump)
INSERT INTO public.countries (code, name, dial, flag, continent_code, lat, lng) VALUES
  ('NG', 'Nigeria', '+234', '🇳🇬', 'AF', 9.08, 8.68),
  ('ZA', 'South Africa', '+27', '🇿🇦', 'AF', -30.56, 22.94),
  ('EG', 'Egypt', '+20', '🇪🇬', 'AF', 26.82, 30.80),
  ('KE', 'Kenya', '+254', '🇰🇪', 'AF', -0.02, 37.91),
  ('GH', 'Ghana', '+233', '🇬🇭', 'AF', 7.95, -1.02),
  ('JP', 'Japan', '+81', '🇯🇵', 'AS', 36.20, 138.25),
  ('KR', 'South Korea', '+82', '🇰🇷', 'AS', 35.91, 127.77),
  ('CN', 'China', '+86', '🇨🇳', 'AS', 35.86, 104.20),
  ('IN', 'India', '+91', '🇮🇳', 'AS', 20.59, 78.96),
  ('ID', 'Indonesia', '+62', '🇮🇩', 'AS', -0.79, 113.92),
  ('PH', 'Philippines', '+63', '🇵🇭', 'AS', 12.88, 121.77),
  ('TH', 'Thailand', '+66', '🇹🇭', 'AS', 15.87, 100.99),
  ('VN', 'Vietnam', '+84', '🇻🇳', 'AS', 14.06, 108.28),
  ('SG', 'Singapore', '+65', '🇸🇬', 'AS', 1.35, 103.82),
  ('MY', 'Malaysia', '+60', '🇲🇾', 'AS', 4.21, 101.98),
  ('TR', 'Türkiye', '+90', '🇹🇷', 'AS', 38.96, 35.24),
  ('SA', 'Saudi Arabia', '+966', '🇸🇦', 'AS', 23.89, 45.08),
  ('AE', 'United Arab Emirates', '+971', '🇦🇪', 'AS', 23.42, 53.85),
  ('GB', 'United Kingdom', '+44', '🇬🇧', 'EU', 55.38, -3.44),
  ('FR', 'France', '+33', '🇫🇷', 'EU', 46.23, 2.21),
  ('DE', 'Germany', '+49', '🇩🇪', 'EU', 51.17, 10.45),
  ('IT', 'Italy', '+39', '🇮🇹', 'EU', 41.87, 12.57),
  ('ES', 'Spain', '+34', '🇪🇸', 'EU', 40.46, -3.75),
  ('PT', 'Portugal', '+351', '🇵🇹', 'EU', 39.40, -8.22),
  ('NL', 'Netherlands', '+31', '🇳🇱', 'EU', 52.13, 5.29),
  ('PL', 'Poland', '+48', '🇵🇱', 'EU', 51.92, 19.15),
  ('SE', 'Sweden', '+46', '🇸🇪', 'EU', 60.13, 18.64),
  ('US', 'United States', '+1', '🇺🇸', 'NA', 37.09, -95.71),
  ('CA', 'Canada', '+1', '🇨🇦', 'NA', 56.13, -106.35),
  ('MX', 'Mexico', '+52', '🇲🇽', 'NA', 23.63, -102.55),
  ('BR', 'Brazil', '+55', '🇧🇷', 'SA', -14.24, -51.93),
  ('AR', 'Argentina', '+54', '🇦🇷', 'SA', -38.42, -63.62),
  ('CO', 'Colombia', '+57', '🇨🇴', 'SA', 4.57, -74.30),
  ('CL', 'Chile', '+56', '🇨🇱', 'SA', -35.68, -71.54),
  ('AU', 'Australia', '+61', '🇦🇺', 'OC', -25.27, 133.78),
  ('NZ', 'New Zealand', '+64', '🇳🇿', 'OC', -40.90, 174.89)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  dial = EXCLUDED.dial,
  flag = EXCLUDED.flag,
  continent_code = EXCLUDED.continent_code,
  lat = COALESCE(public.countries.lat, EXCLUDED.lat),
  lng = COALESCE(public.countries.lng, EXCLUDED.lng);

INSERT INTO public.states_provinces (id, country_code, name, code, lat, lng)
SELECT gen_random_uuid(), v.country_code, v.name, v.code, v.lat, v.lng
FROM (VALUES
  ('NG', 'Lagos State', 'LA', 6.52, 3.38),
  ('NG', 'FCT', 'FC', 9.08, 7.40),
  ('JP', 'Tokyo', '13', 35.68, 139.69),
  ('JP', 'Osaka', '27', 34.69, 135.50),
  ('US', 'California', 'CA', 36.78, -119.42),
  ('US', 'New York', 'NY', 43.00, -75.00),
  ('GB', 'England', 'ENG', 52.36, -1.17),
  ('BR', 'São Paulo', 'SP', -23.55, -46.63),
  ('KR', 'Seoul', '11', 37.57, 126.98),
  ('IN', 'Maharashtra', 'MH', 19.75, 75.71)
) AS v(country_code, name, code, lat, lng)
WHERE EXISTS (SELECT 1 FROM public.countries c WHERE c.code = v.country_code)
  AND NOT EXISTS (
    SELECT 1 FROM public.states_provinces s
    WHERE s.country_code = v.country_code AND lower(s.name) = lower(v.name)
  );

INSERT INTO public.cities (id, country_code, state_id, name, lat, lng)
SELECT gen_random_uuid(), v.country_code, s.id, v.city, v.lat, v.lng
FROM (VALUES
  ('NG', 'Lagos State', 'Lagos', 6.52, 3.38),
  ('NG', 'FCT', 'Abuja', 9.06, 7.49),
  ('JP', 'Tokyo', 'Tokyo', 35.68, 139.69),
  ('JP', 'Osaka', 'Osaka', 34.69, 135.50),
  ('US', 'California', 'Los Angeles', 34.05, -118.24),
  ('US', 'New York', 'New York City', 40.71, -74.01),
  ('GB', 'England', 'London', 51.51, -0.13),
  ('BR', 'São Paulo', 'São Paulo', -23.55, -46.63),
  ('KR', 'Seoul', 'Seoul', 37.57, 126.98),
  ('IN', 'Maharashtra', 'Mumbai', 19.08, 72.88)
) AS v(country_code, state_name, city, lat, lng)
JOIN public.states_provinces s
  ON s.country_code = v.country_code AND lower(s.name) = lower(v.state_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cities c
  WHERE c.country_code = v.country_code AND lower(c.name) = lower(v.city)
);

-- Privacy: hide exact counts under 5
CREATE OR REPLACE FUNCTION public.geo_privacy_count(raw_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN raw_count IS NULL OR raw_count < 5 THEN NULL ELSE raw_count END;
$$;
GRANT EXECUTE ON FUNCTION public.geo_privacy_count(integer) TO anon, authenticated;

-- Secure public profile RPC (app must stop using public_profiles view)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  gender text,
  continent_code text,
  country_code text,
  city_id uuid,
  age integer,
  favorite_anime text[],
  favorite_characters text[],
  favorite_genres text[],
  anime_watchlist text[],
  manga_list text[],
  xp integer,
  level integer,
  reputation integer,
  follower_count integer,
  following_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id, p.username, p.display_name, p.avatar_url, p.bio, p.gender,
    p.continent_code, p.country_code, p.city_id,
    CASE WHEN p.date_of_birth IS NULL THEN NULL
         ELSE EXTRACT(YEAR FROM age(current_date, p.date_of_birth))::integer END,
    p.favorite_anime, p.favorite_characters, p.favorite_genres,
    p.anime_watchlist, p.manga_list, p.xp, p.level, p.reputation,
    p.follower_count, p.following_count, p.created_at
  FROM public.profiles p
  WHERE lower(p.username) = lower(trim(p_username))
    AND p.moderation_status = 'active'
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "profiles_select_public_active" ON public.profiles;
CREATE POLICY "profiles_select_public_active" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (moderation_status = 'active');

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT (
  id, username, display_name, avatar_url, bio, gender,
  continent_code, country_code, state_id, city_id, local_area_id,
  favorite_anime, favorite_characters, favorite_genres,
  anime_watchlist, manga_list,
  xp, level, reputation, follower_count, following_count,
  created_at, moderation_status
) ON public.profiles TO anon, authenticated;
GRANT UPDATE (
  display_name, avatar_url, bio, gender,
  continent_code, country_code, state_id, city_id, local_area_id,
  favorite_anime, favorite_characters, favorite_genres,
  anime_watchlist, manga_list
) ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_geography(q text, result_limit integer DEFAULT 20)
RETURNS TABLE (
  kind text,
  id text,
  name text,
  subtitle text,
  continent_code text,
  country_code text,
  flag text,
  lat double precision,
  lng double precision
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  term text := lower(trim(COALESCE(q, '')));
  lim integer := LEAST(GREATEST(COALESCE(result_limit, 20), 1), 40);
BEGIN
  IF term = '' THEN RETURN; END IF;
  RETURN QUERY
  (
    SELECT 'continent'::text, c.code::text, c.name, 'Continent'::text, c.code, NULL::text, NULL::text, NULL::float8, NULL::float8
    FROM public.continents c
    WHERE lower(c.name) LIKE '%' || term || '%' OR lower(c.code) = term
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'country'::text, co.code::text, co.name, COALESCE(ct.name, co.continent_code), co.continent_code, co.code, co.flag, co.lat, co.lng
    FROM public.countries co
    LEFT JOIN public.continents ct ON ct.code = co.continent_code
    WHERE lower(co.name) LIKE '%' || term || '%' OR lower(co.code) = term
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'state'::text, s.id::text, s.name, COALESCE(co.name, s.country_code), co.continent_code, s.country_code, co.flag, s.lat, s.lng
    FROM public.states_provinces s
    LEFT JOIN public.countries co ON co.code = s.country_code
    WHERE lower(s.name) LIKE '%' || term || '%'
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'city'::text, ci.id::text, ci.name, COALESCE(co.name, ci.country_code), co.continent_code, ci.country_code, co.flag, ci.lat, ci.lng
    FROM public.cities ci
    LEFT JOIN public.countries co ON co.code = ci.country_code
    WHERE lower(ci.name) LIKE '%' || term || '%'
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'local_area'::text, la.id::text, la.name, COALESCE(ci.name, 'Local area'), co.continent_code, ci.country_code, co.flag, ci.lat, ci.lng
    FROM public.local_areas la
    JOIN public.cities ci ON ci.id = la.city_id
    LEFT JOIN public.countries co ON co.code = ci.country_code
    WHERE lower(la.name) LIKE '%' || term || '%'
    LIMIT lim
  )
  LIMIT lim;
END;
$$;
GRANT EXECUTE ON FUNCTION public.search_geography(text, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_world_overview()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  total_members integer;
  by_continent json;
BEGIN
  SELECT count(*)::integer INTO total_members
  FROM public.profiles WHERE moderation_status = 'active';

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.member_count DESC NULLS LAST), '[]'::json)
  INTO by_continent
  FROM (
    SELECT c.code, c.name, public.geo_privacy_count(count(p.id)::integer) AS member_count
    FROM public.continents c
    LEFT JOIN public.profiles p ON p.continent_code = c.code AND p.moderation_status = 'active'
    GROUP BY c.code, c.name
  ) t;

  RETURN json_build_object(
    'total_members', public.geo_privacy_count(total_members),
    'total_members_raw_bucket', CASE
      WHEN total_members < 5 THEN 'sparse'
      WHEN total_members < 50 THEN 'growing'
      ELSE 'active' END,
    'continents', by_continent
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_world_overview() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_geo_stats(p_kind text, p_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  member_count integer := 0;
  child_json json := '[]'::json;
  meta json := '{}'::json;
  popular_genres json := '[]'::json;
BEGIN
  IF p_kind = 'continent' THEN
    SELECT json_build_object('code', c.code, 'name', c.name, 'kind', 'continent')
    INTO meta FROM public.continents c WHERE c.code = upper(p_id);
    SELECT count(*)::integer INTO member_count
    FROM public.profiles WHERE continent_code = upper(p_id) AND moderation_status = 'active';
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.member_count DESC NULLS LAST), '[]'::json)
    INTO child_json FROM (
      SELECT co.code AS id, co.name, co.flag, 'country'::text AS kind,
             public.geo_privacy_count(count(p.id)::integer) AS member_count
      FROM public.countries co
      LEFT JOIN public.profiles p ON p.country_code = co.code AND p.moderation_status = 'active'
      WHERE co.continent_code = upper(p_id)
      GROUP BY co.code, co.name, co.flag
    ) t;

  ELSIF p_kind = 'country' THEN
    SELECT json_build_object(
      'code', co.code, 'name', co.name, 'flag', co.flag, 'dial', co.dial,
      'continent_code', co.continent_code, 'lat', co.lat, 'lng', co.lng, 'kind', 'country'
    ) INTO meta FROM public.countries co WHERE co.code = upper(p_id);
    SELECT count(*)::integer INTO member_count
    FROM public.profiles WHERE country_code = upper(p_id) AND moderation_status = 'active';
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.member_count DESC NULLS LAST), '[]'::json)
    INTO child_json FROM (
      SELECT s.id::text AS id, s.name, 'state'::text AS kind,
             public.geo_privacy_count(count(p.id)::integer) AS member_count
      FROM public.states_provinces s
      LEFT JOIN public.profiles p ON p.state_id = s.id AND p.moderation_status = 'active'
      WHERE s.country_code = upper(p_id)
      GROUP BY s.id, s.name
    ) t;
    SELECT COALESCE(json_agg(g.genre), '[]'::json) INTO popular_genres FROM (
      SELECT unnest(p.favorite_genres) AS genre, count(*) AS c
      FROM public.profiles p
      WHERE p.country_code = upper(p_id) AND p.moderation_status = 'active'
      GROUP BY 1 HAVING count(*) >= 5 ORDER BY c DESC LIMIT 8
    ) g;

  ELSIF p_kind = 'state' THEN
    SELECT json_build_object(
      'id', s.id, 'name', s.name, 'country_code', s.country_code,
      'lat', s.lat, 'lng', s.lng, 'kind', 'state'
    ) INTO meta FROM public.states_provinces s WHERE s.id::text = p_id;
    SELECT count(*)::integer INTO member_count
    FROM public.profiles WHERE state_id::text = p_id AND moderation_status = 'active';
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.member_count DESC NULLS LAST), '[]'::json)
    INTO child_json FROM (
      SELECT ci.id::text AS id, ci.name, 'city'::text AS kind,
             public.geo_privacy_count(count(p.id)::integer) AS member_count
      FROM public.cities ci
      LEFT JOIN public.profiles p ON p.city_id = ci.id AND p.moderation_status = 'active'
      WHERE ci.state_id::text = p_id
      GROUP BY ci.id, ci.name
    ) t;

  ELSIF p_kind = 'city' THEN
    SELECT json_build_object(
      'id', ci.id, 'name', ci.name, 'country_code', ci.country_code,
      'state_id', ci.state_id, 'lat', ci.lat, 'lng', ci.lng, 'kind', 'city'
    ) INTO meta FROM public.cities ci WHERE ci.id::text = p_id;
    SELECT count(*)::integer INTO member_count
    FROM public.profiles WHERE city_id::text = p_id AND moderation_status = 'active';
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.member_count DESC NULLS LAST), '[]'::json)
    INTO child_json FROM (
      SELECT la.id::text AS id, la.name, 'local_area'::text AS kind,
             public.geo_privacy_count(count(p.id)::integer) AS member_count
      FROM public.local_areas la
      LEFT JOIN public.profiles p ON p.local_area_id = la.id AND p.moderation_status = 'active'
      WHERE la.city_id::text = p_id
      GROUP BY la.id, la.name
    ) t;

  ELSIF p_kind = 'local_area' THEN
    SELECT json_build_object('id', la.id, 'name', la.name, 'city_id', la.city_id, 'kind', 'local_area')
    INTO meta FROM public.local_areas la WHERE la.id::text = p_id;
    SELECT count(*)::integer INTO member_count
    FROM public.profiles WHERE local_area_id::text = p_id AND moderation_status = 'active';
  ELSE
    RETURN json_build_object('error', 'unknown_kind');
  END IF;

  IF meta IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  RETURN json_build_object(
    'meta', meta,
    'member_count', public.geo_privacy_count(member_count),
    'member_status', CASE WHEN member_count < 5 THEN 'not_enough_data' ELSE 'ok' END,
    'children', child_json,
    'popular_genres', popular_genres
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_geo_stats(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_trending_locations(result_limit integer DEFAULT 8)
RETURNS TABLE (
  kind text, id text, name text, flag text, continent_code text, member_count integer
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT 'country'::text, co.code, co.name, co.flag, co.continent_code,
         public.geo_privacy_count(count(p.id)::integer)
  FROM public.countries co
  LEFT JOIN public.profiles p ON p.country_code = co.code AND p.moderation_status = 'active'
  GROUP BY co.code, co.name, co.flag, co.continent_code
  HAVING count(p.id) >= 5
  ORDER BY count(p.id) DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 8), 1), 20);
$$;
GRANT EXECUTE ON FUNCTION public.get_trending_locations(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_countries_by_continent(p_continent text)
RETURNS TABLE (
  code text, name text, flag text, dial text,
  lat double precision, lng double precision, member_count integer
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT co.code, co.name, co.flag, co.dial, co.lat, co.lng,
         public.geo_privacy_count(count(p.id)::integer)
  FROM public.countries co
  LEFT JOIN public.profiles p ON p.country_code = co.code AND p.moderation_status = 'active'
  WHERE co.continent_code = upper(p_continent)
  GROUP BY co.code, co.name, co.flag, co.dial, co.lat, co.lng
  ORDER BY co.name;
$$;
GRANT EXECUTE ON FUNCTION public.list_countries_by_continent(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_continents()
RETURNS TABLE (code text, name text, member_count integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.code, c.name, public.geo_privacy_count(count(p.id)::integer)
  FROM public.continents c
  LEFT JOIN public.profiles p ON p.continent_code = c.code AND p.moderation_status = 'active'
  GROUP BY c.code, c.name
  ORDER BY c.name;
$$;
GRANT EXECUTE ON FUNCTION public.list_continents() TO anon, authenticated;
