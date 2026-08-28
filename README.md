# Wavy

A simplified Notion-style docs app: workspaces (organizations), members,
document permissions and link-based invitations. Built with Next.js
(App Router), TypeScript, Tailwind CSS v4, Prisma 7, Supabase (auth + hosted
Postgres + Realtime) and TipTap.

## Features

### Authentication

- Email + password sign-up and login, with Supabase email confirmation support.
- Session refresh middleware (`proxy.ts`) that also guards routes — protected
  pages require a session, and signed-in users are bounced away from
  `/login` / `/register`.

### Workspaces (organizations)

- Create a workspace; the creator becomes the OWNER.
- Belong to multiple workspaces and switch between them from the sidebar;
  the current one persists across visits.
- Rename or delete the workspace (OWNER only) via org settings.
- New users without a workspace are prompted to create one before entering
  the dashboard.

### Members & roles

- Org roles: **OWNER > ADMIN > MEMBER**, with abilities derived from rank —
  ADMIN+ can invite and remove members, only the OWNER administers the org.
- Member list with remove (confirmation modal, guards: can't remove the
  owner or yourself) and role changes (OWNER only, can't touch the owner or
  your own role).

### Invitations

- Invite by email + role (ADMIN+); a single-use link (`/invite/<token>`) is
  copied in-app and **expires after 7 days**.
- Accept flow validates not-found / expired / already-used tokens, honors
  email-addressed invites, never downgrades an existing role, and joins the
  invitee straight into that workspace.

### Documents

- **TipTap rich-text editor** with title, emoji page icon, and debounced
  **autosave** through a server action.
- **Real-time updates** — Supabase Realtime pushes saved changes to every
  open session, so collaborators see each other's edits without refreshing
  (unsaved local work is never clobbered).
- Document list per workspace, ordered by last updated, showing only what
  the caller can see (owners see everything, including private docs).
- Delete by the creator or org ADMIN+.

### Sharing & permissions

- Per-user doc roles: **EDITOR / VIEWER**, overridable per document.
- Org-wide toggle with a **workspace-wide access level** — once a document
  is visible to everyone, choose whether members can **edit** or only
  **view** it.
- Effective access is decided server-side: creator always has full access,
  the org OWNER sees and edits everything, explicit grants beat the org
  default, and anything not shared stays invisible.
- Share modal for toggling org-wide access and granting/changing/revoking
  per-user permissions (creator or ADMIN+ only).

### Security posture

- Every mutation is a Server Action that re-checks auth and permissions
  server-side before touching data — the UI is never trusted.
- Permission logic is pure functions taking ids (not stale objects),
  combined with one Prisma lookup per action.

## How it's put together

| Piece | Where |
| --- | --- |
| Auth session helpers | `lib/supabase/{server,client}.ts`, `proxy.ts` (session refresh + route guards) |
| Data model | `prisma/schema.prisma` |
| Role & access logic (pure functions) | `lib/permissions.ts` |
| Server Actions for all mutations | `app/actions/{auth,org,documents,members,invitations,sharing}.ts` |
| Realtime document updates | `components/documents/document-editor.tsx` (Supabase Realtime channel per doc) |
| Design tokens (Notion palette) | `app/globals.css` |

A deeper guide — feature-by-feature, folder structure, key flows — lives in
[CODEBASE.md](CODEBASE.md).

## Requirements

- Node.js 20+
- A free [Supabase](https://supabase.com) project (Auth + Postgres, with
  Realtime enabled for the `Document` table if you want live updates)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase values
   (Project Settings → API / Database):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
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

## Notes

- User ids reference Supabase `auth.users`, which lives in another schema.
  Prisma never joins across schemas, so every `userId` is a plain indexed text
  column joined in application code through the `UserProfile` mirror table.
- No email delivery in V1 — invitation links are copied in-app.
- No shadows anywhere in the design system; depth comes from borders,
  background contrast and spacing only.
