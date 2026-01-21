# Planes BA

Planes BA is a mobile-first web app that turns Instagram plans into structured events and adds them to any Google Calendar you can access (including shared calendars).

## Architecture overview

- **Next.js 14 App Router** for the UI and server actions.
- **NextAuth (Google OAuth)** for sign-in and Google Calendar scopes.
- **Prisma + SQLite** for users and plan drafts.
- **Google Calendar API** via `googleapis` to list calendars and create events.
- **Zod** for form validation on the confirmation step.
- **Tailwind CSS** for styling.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your values (see below).
4. Create the SQLite database:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment variables

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Google OAuth configuration

1. Create a Google Cloud project.
2. Configure the OAuth consent screen.
3. Create OAuth client credentials (Web application).
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
5. Add the required scopes in the consent screen:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`

## How it works

- Sign in with Google on `/login`.
- Use `/settings` to pick your default calendar.
- Add a plan on `/new` from an Instagram link, text, or flyer.
- Confirm and edit details on `/confirm/[id]`.
- Create the event in your selected calendar or save a draft.

## Limitations

- OCR is a stub. Uploaded images are stored with placeholder text until OCR is wired.
- Date/time parsing is heuristic and should be improved for production.
- The MVP assumes valid Google Calendar permissions on the connected account.

## Useful commands

- `npm run dev` — run the dev server
- `npm run build` — build for production
- `npm run prisma:migrate` — run migrations
