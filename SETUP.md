# Base de Estudo — Setup & Deploy

This app is **code-complete**. To run it you need to create three free accounts'
worth of config (Google Cloud, Supabase, Vercel) and fill in environment
variables. Follow these steps in order. Everything Google-related is **keyless**
(public folders + public calendar + an API key) — no OAuth verification needed.

---

## 0. Local prerequisites

- Node 18+ (you have v24). From `study-base-app/`:
  ```powershell
  npm install
  Copy-Item .env.local.example .env.local
  ```
  You'll fill `.env.local` as you go. Run the dev server any time with `npm run dev`
  (http://localhost:3000).

---

## 1. Google Cloud — API key (Drive + Calendar)

1. Go to https://console.cloud.google.com → create a project (e.g. "base-estudo").
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Calendar API**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Click the key → **Restrict key** → under "API restrictions" select *Restrict key*
   and tick **Google Drive API** + **Google Calendar API**. Save.
5. Put it in `.env.local`:
   ```
   GOOGLE_API_KEY=AIza...
   ```

> The key is only ever used server-side (in `/api/drive`, `/api/calendar`,
> `/api/cron/reminders`). It is never sent to the browser.

---

## 2. Make the Drive folders public

For each of the 3 folders (DNA, NEEM, Wannabe): open in Google Drive → **Share** →
General access → **Anyone with the link** → *Viewer*. (NEEM/Wannabe may already be
shared by their owners — if you can open them in an incognito window, they're public.)

The folder IDs are already in `src/lib/constants.ts`. If a subject's listing comes
back empty/forbidden, that folder isn't public yet.

---

## 3. Make the exam calendar public

1. Google Calendar → the calendar that holds your exams → **Settings**.
2. **Access permissions** → tick **Make available to public** → *See all event details*.
3. Scroll to **Integrate calendar** → copy the **Calendar ID**.
4. Put it in `.env.local`:
   ```
   EXAM_CALENDAR_ID=...@group.calendar.google.com
   ```
   (A default ID from the prototype is already baked in; override it here if yours differs.)

Exams are detected by the word **"testes"** in the event title.

---

## 4. Supabase — database + Google login

1. Create a project at https://supabase.com (free tier).
2. **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → Run.
   This creates the tables + row-level security.
3. **Project Settings → API**: copy the **Project URL**, the **anon public** key,
   and the **service_role** key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # secret — server only
   ```
4. **Google login** (separate from the API key above):
   - In Google Cloud → **Credentials → Create credentials → OAuth client ID** →
     type **Web application**.
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (Supabase shows this exact URL under Authentication → Providers → Google).
   - Copy the Client ID + Client secret into Supabase → **Authentication → Providers
     → Google** → enable + paste → save.
   - Supabase → **Authentication → URL Configuration**: set **Site URL** to
     `http://localhost:3000` for now, and add redirect URLs:
     `http://localhost:3000/**` (add your Vercel URL later too).

You can now `npm run dev`, open the app, and sign in with Google.

---

## 5. Web push (VAPID) keys

```powershell
npx web-push generate-vapid-keys
```
Copy the two values into `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tiagofraga06@gmail.com
CRON_SECRET=<any-long-random-string>
```

---

## 6. Deploy to Vercel

1. Push `study-base-app/` to a GitHub repo.
2. https://vercel.com → **New Project** → import the repo (root = `study-base-app`).
3. **Environment Variables**: add every key from `.env.local` (all of section 1–5).
4. Deploy. You get `https://<name>.vercel.app`.
5. Go back and update:
   - Supabase **Site URL** → your Vercel URL; add `https://<name>.vercel.app/**` to redirect URLs.
   - Google OAuth client → no change needed (redirect stays the Supabase callback).
6. The exam-reminder cron (`vercel.json`, daily 06:00 UTC ≈ 07:00 Lisbon) is
   registered automatically. Vercel sends the `CRON_SECRET` as a Bearer token.

---

## 7. Install on your phone (Android)

Open the Vercel URL in Chrome → menu **⋮ → Install app** (or "Add to Home Screen").
Launch from the icon → full-screen. In **Definições → Notificações de exames** tap
**Ativar notificações** and allow the prompt.

---

## 8. End-to-end test checklist

- [ ] Sign in with Google; signing out returns you to `/login`.
- [ ] **Drives**: DNA/NEEM/Wannabe trees expand; a PDF previews inline; "Abrir ↗" opens Drive.
- [ ] **Exames**: only "testes" events show, with correct day countdowns; month view works.
- [ ] **To-do**: add a task with subject + due date on laptop → appears on phone after refresh; toggle/delete persist.
- [ ] **Cadeiras → a subject**: Materiais shows its folders; Notas filtered to it; Progresso saves; Exames matches it.
- [ ] **Progresso**: ticking a topic survives a reload.
- [ ] **Push**: enable notifications, then trigger the cron manually against a near-term test exam:
  ```powershell
  curl.exe -H "Authorization: Bearer <CRON_SECRET>" https://<name>.vercel.app/api/cron/reminders
  ```
  A notification should arrive; a second call should NOT re-send (deduped via `sent_reminders`).

---

## Quick local sanity checks (before any UI)

```powershell
# Drive (replace KEY + a public folder id)
curl.exe "https://www.googleapis.com/drive/v3/files?q='1QNE0knQxCFRlomaKCKq0oJIg-0O76K4u'+in+parents&key=YOUR_KEY&fields=files(id,name,mimeType)"

# Calendar (replace KEY + calendar id)
curl.exe "https://www.googleapis.com/calendar/v3/calendars/CAL_ID/events?key=YOUR_KEY&singleEvents=true&orderBy=startTime&maxResults=5"
```
If these return JSON with `files`/`items`, the keyless setup is correct.
