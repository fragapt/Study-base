# Base de Estudo

Personal study hub (PWA): Google Drive browsing with in-app preview, exam
countdowns from Google Calendar, synced to-dos, and a dedicated space per subject
with study-progress checklists. Notion-style dark UI. Installable on Android.

## Stack
- **Next.js 15** (App Router, TypeScript) → Vercel
- **Tailwind CSS v4** (design tokens ported from the original prototype)
- **Supabase** (Postgres + RLS, Google sign-in) for synced notes/progress/push
- **Google Drive + Calendar REST**, keyless via a server-side API key (public folders/calendar)
- **Web Push** (VAPID) + Vercel Cron for exam reminders

## Getting started
See **[SETUP.md](./SETUP.md)** for the full account + environment setup. Then:
```powershell
npm install
npm run dev
```

## Structure
```
src/
  app/
    (app)/            # authenticated pages (Dashboard, Exames, Drives, To-do, Cadeiras, Progresso, Definições)
    api/              # drive, calendar, push/subscribe, cron/reminders
    auth/callback/    # Supabase OAuth code exchange
    login/  offline/
  components/         # drives/, exams/, todo/, progress/, subject/, AppShell, Sidebar, MobileNav
  lib/                # constants (subjects/folders/topics), google, dates, supabase/, hooks
supabase/migrations/  # 0001_init.sql
public/               # manifest.webmanifest, sw.js, icons/
```

## How features map to data
- **Subjects, folder mappings, study topics** are fixed constants in `src/lib/constants.ts`.
- **Notes, progress completion, push subscriptions, reminder dedupe** live in Supabase (RLS-scoped to the user).
- **Drive/Calendar** are read live through `/api/*` with the server-side key (cached briefly).

The app shell runs even before Supabase is configured (auth + sync are gated on
`HAS_SUPABASE`), so you can preview the UI immediately after `npm run dev`.
