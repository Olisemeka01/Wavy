# Wavy — Features & Codebase Guide

A simplified Notion-style docs app: workspaces (organizations), members,
per-document permissions, and link-based invitations.

**Stack:** Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 ·
Prisma 7 (with the `pg` driver adapter) · Supabase (auth + hosted Postgres) ·
TipTap 3 (rich text editor) · lucide-react (icons)

---

## Features

### 1. Authentication (Supabase Auth)

- **Email + password registration** with client-friendly validation
  (email format, 8+ char password). Supabase email confirmation is supported —
  after sign-up without a session, the user is sent to `/register/confirm`.
- **Login / logout** with redirect support (`?next=…` preserved through the
  auth callback).
- **Session refresh middleware** ([proxy.ts](proxy.ts)): refreshes the Supabase
  token on every request and guards routes —
  - `/documents`, `/organization/*` require a session (else → `/login`)
  - `/login`, `/register` redirect signed-in users to `/documents`
- **Email confirmation callback** at `/auth/callback` exchanges the Supabase
  code for a session.
- **User profile mirroring:** identity lives in Supabase's `auth.users`
  (another Postgres schema Prisma can't join to), so a `UserProfile` row is
  upserted on first authenticated request ([lib/auth.ts](lib/auth.ts)) and all
  app data joins against it.

### 2. Organizations (workspaces)

- **Create a workspace** — auto-generated slug (`name + short uuid`), creator
  becomes `OWNER`.
- **Multi-org membership** with a "current org" concept persisted in an
  httpOnly cookie (`wavy-current-org`); falls back to the oldest membership.
- **Switch workspace** from the sidebar.
- **Rename or delete the workspace** (OWNER only), via org settings.
- **Create-org gate** — a user with no orgs is prompted to create one before
  using the dashboard.

### 3. Members & roles

- **Org roles:** `OWNER` > `ADMIN` > `MEMBER` (ranked comparison in
  [lib/permissions.ts](lib/permissions.ts)).
- **Abilities per role:** every role can view/create documents; only ADMIN+
  can invite or remove members; only OWNER can administer the org (rename,
  delete, change roles).
- **Member list** with roles; **remove member** (ADMIN+, with guards: can't
  remove the OWNER, can't remove yourself).
- **Change a member's role** (OWNER only, via org settings).

### 4. Invitations (link-based)

- **Invite by email + role** (ADMIN+) → creates a single-use token; the link
  `/invite/<token>` is copied in-app (no email delivery in V1).
- Invitations **expire after 7 days** and are **single-use**.
- **Accept flow** ([app/actions/invitations.ts](app/actions/invitations.ts)):
  validates not-found / expired / already-used; an invite addressed to a
  specific email only works for that account; joining never downgrades an
  existing role; the accepting org becomes the current one.

### 5. Documents

- **Create documents** in the current org — they start **org-wide** (visible
  to every member).
- **TipTap rich-text editor** with title, emoji page icon, and **autosave**
  (debounced `saveDocument` server action writing TipTap JSON).
- **Document list** per org, ordered by last-updated, showing only documents
  the caller can actually see.
- **Delete document** — creator or org ADMIN+.
- **Loading skeleton** for the documents route; custom 404 page globally.

### 6. Document sharing & permissions

- **Doc roles:** `EDITOR` / `VIEWER` per user per document
  (`DocumentPermission`).
- **Effective access rules** ([lib/permissions.ts](lib/permissions.ts)):
  - org membership is required for any access;
  - the creator is implicitly EDITOR;
  - an explicit permission row wins over org-wide visibility;
  - no permission row → org default applies: `isOrgWide` documents are
    viewable by all members, others are invisible.
- **Share modal** ([components/documents/share-modal.tsx](components/documents/share-modal.tsx)):
  - toggle **org-wide access** on/off;
  - grant/change/revoke per-user EDITOR/VIEWER permissions;
  - management allowed for the **creator or ADMIN+** (plain EDITORs write
    content, not access rules).

### 7. Design system & UX

- **Notion-palette design tokens** in [app/globals.css](app/globals.css) —
  deliberately **no shadows anywhere**; depth comes from borders, background
  contrast and spacing.
- Reusable primitives in [components/ui/](components/ui/): button, input,
  modal, dropdown.
- Icons via lucide-react; class merging helper in [lib/cn.ts](lib/cn.ts).

### 8. Security posture

- **Every mutation is a Server Action** that re-checks auth + permissions
  server-side before touching data — the UI is never trusted.
- Permission logic is **pure functions** taking ids (not stale objects),
  combined with one Prisma lookup per action.
- Prisma client is a **singleton on `globalThis`** in dev to avoid connection
  exhaustion ([lib/db.ts](lib/db.ts)).

### 9. Demo data

- `npx tsx prisma/seed.ts <registered-email>` attaches a demo workspace with
  two documents to an already-registered account (auth users can't be created
  by the seed because Supabase owns them).

---

## Folder structure

```
Wavy/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: unauthenticated pages (shared minimal layout)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── register/confirm/page.tsx   # "check your inbox" screen
│   ├── (dashboard)/            # Route group: authenticated app (sidebar layout)
│   │   ├── layout.tsx          # Sidebar + current-org context
│   │   ├── documents/
│   │   │   ├── page.tsx        # Document grid/list for the current org
│   │   │   ├── loading.tsx     # Skeleton
│   │   │   └── [documentId]/page.tsx   # Editor page for one document
│   │   └── organization/
│   │       ├── members/page.tsx        # Member list + invite
│   │       └── settings/page.tsx       # Rename/delete org, role changes
│   ├── actions/                # ALL mutations live here as Server Actions
│   │   ├── auth.ts             # register, login, logout
│   │   ├── org.ts              # create/switch/rename/delete organization
│   │   ├── documents.ts        # create, save (autosave), delete document
│   │   ├── members.ts          # removeMember, createInvitation
│   │   ├── invitations.ts      # acceptInvitation (token consume)
│   │   └── sharing.ts          # getSharingInfo, setOrgWideAccess, set/removeUserPermission
│   ├── auth/callback/route.ts  # Supabase email-confirmation → session exchange
│   ├── invite/[token]/page.tsx # Public invite accept page
│   ├── generated/prisma/       # Prisma 7 generated client (committed output) — do not edit
│   ├── globals.css             # Design tokens (Notion palette) + Tailwind v4 setup
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing / redirect entry
│   └── not-found.tsx           # Custom 404
├── components/
│   ├── auth/                   # AuthCard, LoginForm, RegisterForm (useActionState)
│   ├── documents/              # DocumentCard, DocumentEditor (TipTap), ShareModal,
│   │   │                       # NewDocumentButton, editor.css (TipTap styles)
│   ├── organization/           # CreateOrgModal/Gate, InviteButton, MemberList,
│   │                           # OrgSettingsForm, AcceptInviteForm
│   ├── sidebar/sidebar.tsx     # Workspace switcher, avatars, sign out
│   └── ui/                     # Primitives: button, input, modal, dropdown
├── lib/
│   ├── auth.ts                 # getAuthUser / getUser (upserts UserProfile) / requireUser
│   ├── db.ts                   # Prisma client singleton (pg driver adapter)
│   ├── org.ts                  # Memberships, current-org cookie logic, getOrgRole gate
│   ├── documents.ts            # getDocumentWithAccess (cached), listVisibleDocuments
│   ├── permissions.ts          # Pure role/ability/access logic — the auth brain
│   ├── cn.ts                   # Tailwind class merge helper
│   └── supabase/
│       ├── server.ts           # Supabase server client (cookie-based SSR session)
│       └── client.ts           # Supabase browser client
├── prisma/
│   ├── schema.prisma           # UserProfile, Organization, OrganizationMember,
│   │                           # OrganizationInvitation, Document, DocumentPermission
│   ├── migrations/             # SQL migrations (init)
│   └── seed.ts                 # Demo workspace + documents for a registered user
├── prisma7.config.ts           # Prisma CLI config (migrations use DIRECT_URL port 5432)
├── proxy.ts                    # Middleware: session refresh + protected/guest-only routes
├── next.config.ts / tsconfig.json / package.json
└── .agents/skills/             # Local AI-assistant skill packs (docs, not app code)
```

---

## Key flows

**Rendering a document** — request hits `proxy.ts` (token refresh + route
guard) → dashboard page calls `getUser()` (Supabase session + UserProfile
upsert) → `getDocumentWithAccess()` loads the doc, the caller's org role, and
any `DocumentPermission` row → `accessForDocument()` decides view/edit →
page renders read-only or the TipTap editor accordingly.

**Saving** — the editor debounces changes and calls the `saveDocument` server
action, which re-verifies `access.canEdit` server-side before writing; the UI
is never trusted.

**Inviting** — ADMIN+ creates an invitation → token link copied in-app →
invitee opens `/invite/<token>` → `acceptInvitation` validates expiry/use/
email, creates the membership, and sets it as the current org.
