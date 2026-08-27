"use client";

import Link from "next/link";
import {
  ChevronDownIcon,
  FileTextIcon,
  LogOutIcon,
  PlusIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { switchOrganization } from "@/app/actions/org";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { CreateOrgModal } from "@/components/organization/create-org-modal";
import type { Membership } from "@/lib/org";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useState, useTransition } from "react";

export function Sidebar({
  current,
  memberships,
  user,
}: {
  current: Membership;
  memberships: Membership[];
  user: SessionUser;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const org = current.organization;

  function switchTo(organizationId: string) {
    startTransition(() => switchOrganization(organizationId));
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar">
      {/* Workspace switcher */}
      <div className="p-3 pb-1">
        <Dropdown
          trigger={
            <span
              aria-hidden={pending}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold hover:bg-hover"
            >
              <WorkspaceAvatar name={org.name} />
              <span className="truncate">{org.name}</span>
              {memberships.length > 0 ? (
                <ChevronDownIcon className="size-4 shrink-0 text-text-secondary" />
              ) : null}
            </span>
          }
        >
          {(close) => (
            <>
              {memberships.map((m) => (
                <DropdownItem
                  key={m.organization.id}
                  onClick={() => {
                    close();
                    if (m.organization.id !== org.id) switchTo(m.organization.id);
                  }}
                  className={cn(
                    m.organization.id === org.id && "bg-active",
                  )}
                >
                  <WorkspaceAvatar name={m.organization.name} />
                  <span className="truncate">{m.organization.name}</span>
                </DropdownItem>
              ))}
              <div className="my-1 h-px bg-divider" />
              <DropdownItem onClick={() => setCreateOpen(true)}>
                <PlusIcon className="size-4" /> New workspace
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 pt-1" aria-label="Workspace">
        <SidebarLink href="/documents" icon={<FileTextIcon className="size-4" />}>
          Documents
        </SidebarLink>
        <SidebarLink
          href="/organization/members"
          icon={<UsersIcon className="size-4" />}
        >
          Members
        </SidebarLink>
        <SidebarLink
          href="/organization/settings"
          icon={<Settings2Icon className="size-4" />}
        >
          Settings
        </SidebarLink>
      </nav>

      {/* Footer: identity + sign out */}
      <footer className="mt-auto border-t border-divider p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-sm text-text-secondary"
            title={user.email}
          >
            <b className="font-medium text-text">{user.name || "You"}</b>
            {" · "}
            {org.memberCount} member{org.memberCount === 1 ? "" : "s"}
          </span>
          <SignOutButton />
        </div>
      </footer>

      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-text-secondary",
        "transition-colors hover:bg-hover hover:text-text",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export function WorkspaceAvatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-page text-[10px] font-semibold text-text">
      {letter}
    </span>
  );
}

export function SignOutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        <LogOutIcon className="size-4" /> Sign out
      </Button>
    </form>
  );
}
