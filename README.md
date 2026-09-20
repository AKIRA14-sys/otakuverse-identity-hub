# Otakuverse Identity Hub

Build SPACE 1 — OTAKUVERSE IDENTITY for my app.



OTAKUVERSE is a global social platform for anime and manga fans. Build this as a modern, mobile-first responsive PWA with a dark anime-inspired interface that feels premium, clean, and lightweight.



IMPORTANT DATABASE RULE:

I will connect my own Supabase project myself. Do NOT create or provision another Supabase project. Build the Supabase integration around my existing project using environment variables such as VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Create a /supabase folder containing migrations/schema/seed documentation so I can apply the database structure to my own project.



Build:



1. Authentication



- Sign up

- Login

- Logout

- Persistent sessions

- Email verification

- Forgot password

- Password reset

- Protected routes

- Proper loading and error states



2. Registration fields



- Email

- Country

- Phone number

- Username

- Password

- Date of birth

- Gender: Male, Female, Prefer not to say



The country must be selected BEFORE entering the phone number so the phone input automatically uses the correct international calling code. Include all countries, searchable by name, with flag and calling code.



Normalize phone numbers internationally.



Calculate age from date of birth when needed. Do not treat a user-entered age as authoritative.



3. User identity

   Every account must have a permanent unique Supabase Auth UUID. Never use username, email, or phone number as the primary user ID.



Username must be unique.



4. Profiles

   Create the profile architecture with:



- User ID

- Username

- Display name

- Profile picture

- Bio

- Email

- Phone

- Country

- Continent

- State/province/region

- City

- Local area

- Date of birth

- Gender

- Favorite anime

- Favorite characters

- Favorite genres

- Anime watchlist

- Manga list

- XP

- Level

- Badges

- Achievements

- Reputation

- Followers

- Following

- Communities

- Account creation date



Email, phone, exact DOB and other private information must NOT be public by default.



5. Database foundation

   Prepare the initial schema for:



- profiles

- countries

- continents

- states_provinces

- cities

- local_areas



Use proper foreign keys and indexes.



6. Security

   Use Supabase Auth and Row Level Security correctly.

   Do not expose service-role keys.

   Do not use editable user metadata for authorization.

   Users must only be able to modify fields they are actually allowed to modify.



Create reusable components and clean architecture so Spaces 2–6 can extend this system without rebuilding Space 1.



Do not build fake authentication or fake user data. Make the authentication flow ready for my real Supabase project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c75b34f-f812-40a7-8b8e-a18011293fa4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
