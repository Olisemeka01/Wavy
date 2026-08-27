# Wavy

A simplified Notion-style docs app: workspaces (organizations), members,
document permissions and link-based invitations. Built with Next.js
(App Router), TypeScript, Tailwind CSS v4, Prisma 7, Supabase (auth + hosted
Postgres) and TipTap.

## Requirements

- Node.js 20+
- A free [Supabase](https://supabase.com) project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase values
   (Project Settings → API / Database):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` — pooled connection, port **6543** (runtime)
   - `DIRECT_URL` — direct connection, port **5432** (migrations)

3. Apply the schema and generate the client:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Register an account in the app. Email confirmation is on by default in
   Supabase; follow the link from your inbox.

## Demo data (optional)

Register an account, then attach a demo workspace with two documents:

```bash
npx tsx prisma/seed.ts you@example.com
```

## How it's put together

| Piece | Where |
| --- | --- |
| Auth session helpers | `lib/supabase/{server,client}.ts`, `proxy.ts` (session refresh + route guards) |
| Data model | `prisma/schema.prisma` |
| Role & access logic (pure functions) | `lib/permissions.ts` |
| Server Actions for all mutations | `app/actions/{auth,org,documents,members,invitations,sharing}.ts` |
| Design tokens (Notion palette) | `app/globals.css` |

### Notes

- User ids reference Supabase `auth.users`, which lives in another schema.
  Prisma never joins across schemas, so every `userId` is a plain indexed text
  column joined in application code through the `UserProfile` mirror table.
- All permission checks happen server-side before every action; the UI is
  never trusted.
- Invitations are single-use links (`/invite/<token>`) that expire after 7
  days. No email delivery in V1 — links are copied in-app.
- No shadows anywhere in the design system; depth comes from borders,
  background contrast and spacing only.
