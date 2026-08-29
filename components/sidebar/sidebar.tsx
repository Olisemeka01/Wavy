"use client";

import Link from "next/link";
import {
  ChevronDownIcon,
  FileTextIcon,
  HamburgerIcon,
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
import { useEffect, useState, useTransition } from "react";

const SIDEBAR_KEY = "wavy.sidebar-collapsed";

export function Sidebar({
  current,
  memberships,
  user,
}: {
  current: Membership;
  memberships: Membership[];
  user: SessionUser;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore after mount so SSR and the first client render match.
  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      {/* Hamburger + workspace switcher */}
      <div
        className={cn(
          "flex items-center p-3 pb-1",
          collapsed && "flex-col gap-1 px-0",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-text-secondary transition-colors hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <HamburgerIcon className="size-6" />
        </button>

        <div className={cn("min-w-0 flex-1", collapsed && "flex-none")}>
          <WorkspaceSwitcher
            current={current}
            memberships={memberships}
            compact={collapsed}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 pt-1" aria-label="Workspace">
        <SidebarLink
          href="/documents"
          icon={<FileTextIcon className="size-4" />}
          collapsed={collapsed}
        >
          Documents
        </SidebarLink>
        <SidebarLink
          href="/organization/members"
          icon={<UsersIcon className="size-4" />}
          collapsed={collapsed}
        >
          Members
        </SidebarLink>
        <SidebarLink
          href="/organization/settings"
          icon={<Settings2Icon className="size-4" />}
          collapsed={collapsed}
        >
          Settings
        </SidebarLink>
      </nav>

      {/* Footer: identity + sign out */}
      <footer className="mt-auto border-t border-divider p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <SignOutButton iconOnly />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span
              className="truncate text-sm text-text-secondary"
              title={user.email}
            >
              <b className="font-medium text-text">{user.name || "You"}</b>
              {" · "}
              {current.organization.memberCount} member
              {current.organization.memberCount === 1 ? "" : "s"}
            </span>
            <SignOutButton />
          </div>
        )}
      </footer>
    </aside>
  );
}

/** Workspace dropdown shared by the desktop sidebar and the mobile top bar. */
export function WorkspaceSwitcher({
  current,
  memberships,
  compact = false,
}: {
  current: Membership;
  memberships: Membership[];
  /** Avatar-only trigger, used by the collapsed sidebar rail. */
  compact?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const org = current.organization;

  function switchTo(organizationId: string) {
    startTransition(() => switchOrganization(organizationId));
  }

  return (
    <>
      <Dropdown
        trigger={
          <span
            aria-hidden={pending}
            title={compact ? org.name : undefined}
            className={
              compact
                ? "flex items-center justify-center rounded-md p-1 hover:bg-hover"
                : "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold hover:bg-hover"
            }
          >
            <WorkspaceAvatar name={org.name} />
            {!compact && (
              <>
                <span className="truncate">{org.name}</span>
                {memberships.length > 0 ? (
                  <ChevronDownIcon className="size-4 shrink-0 text-text-secondary" />
                ) : null}
              </>
            )}
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

      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function SidebarLink({
  href,
  icon,
  collapsed = false,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm font-medium text-text-secondary",
        collapsed ? "justify-center px-0 py-1.5" : "px-2 py-1",
        "transition-colors hover:bg-hover hover:text-text",
      )}
    >
      {icon}
      {collapsed ? <span className="sr-only">{children}</span> : children}
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

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <form action={logout}>
      <Button
        variant="ghost"
        size="sm"
        type="submit"
        aria-label={iconOnly ? "Sign out" : undefined}
        title={iconOnly ? "Sign out" : undefined}
      >
        <LogOutIcon className="size-4" />
        {iconOnly ? null : " Sign out"}
      </Button>
    </form>
  );
}
