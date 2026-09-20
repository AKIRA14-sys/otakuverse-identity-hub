# Supabase — OTAKUVERSE Space 1

Use **your own** Supabase project. Do not create a second project for this app.

## 1. Environment

In the app root, set:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon / publishable key>
```

See `.env.example`. Never expose the **service_role** key in frontend code.

## 2. Apply the migration

1. Open Supabase Dashboard → **SQL Editor**.
2. Paste the full contents of  
   `migrations/20260320120000_complete_identity.sql`
3. Run it.

Or with the CLI (if linked to your project):

```bash
supabase db push
```

## 3. Auth settings (Dashboard → Authentication)

- **Email** provider enabled.
- Confirm email: recommended **ON** for production.
- Site URL: your app origin (e.g. `http://localhost:5173` or production URL).
- Redirect URLs: include  
  `http://localhost:5173/auth/callback`  
  `http://localhost:5173/auth/reset-password`  
  and the same paths on your production domain.

## 4. What the migration creates

| Object | Purpose |
| --- | --- |
| `continents`, `countries`, `states_provinces`, `cities`, `local_areas` | Geography |
| `profiles` | 1:1 with `auth.users.id` |
| Trigger `on_auth_user_created` | Creates profile from signup metadata |
| `is_username_available(candidate)` | RPC |
| `get_my_profile()` | RPC — own full profile |
| `public_profiles` | View — no email, phone, or exact DOB |
| RLS + column grants | Owner-only private fields; public read via view |
| `guard_profile_update` | Blocks client edits to XP, level, admin flags, etc. |

## 5. Security notes

- Primary ID is always `auth.users.id` / `profiles.id` (UUID).
- Username is unique (case-insensitive) but **not** the primary key.
- Email, phone, and exact date of birth are not selected by `public_profiles`.
- Age on public profiles is computed in the view from DOB.
- Clients cannot set `is_admin`, XP, level, or moderation status.
- Phone is stored as E.164 only. There is **no SMS OTP**. Email confirmation is the real verification path.
