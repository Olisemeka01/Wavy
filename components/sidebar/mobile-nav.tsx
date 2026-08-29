"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import {
  SignOutButton,
  WorkspaceAvatar,
  WorkspaceSwitcher,
} from "@/components/sidebar/sidebar";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/cn";
import type { Membership } from "@/lib/org";
import type { SessionUser } from "@/lib/auth";

const TABS = [
  { href: "/documents", label: "Documents", icon: FileTextIcon },
  { href: "/organization/members", label: "Members", icon: UsersIcon },
  { href: "/organization/settings", label: "Settings", icon: Settings2Icon },
] as const;

/**
 * Small-screen chrome (< lg): top bar with the workspace switcher and an
 * identity menu, plus a fixed bottom tab bar. Pairs with the desktop
 * sidebar, which is hidden below lg.
 */
export function MobileNav({
  current,
  memberships,
  user,
}: {
  current: Membership;
  memberships: Membership[];
  user: SessionUser;
}) {
  const pathname = usePathname();
  const org = current.organization;

  return (
    <>
      <header
        className={cn(
          "flex items-center justify-between gap-1 border-b border-divider bg-sidebar pr-2",
          "pt-[env(safe-area-inset-top)] lg:hidden",
        )}
      >
        <div className="min-w-0 flex-1">
          <WorkspaceSwitcher current={current} memberships={memberships} />
        </div>

        <Dropdown
          align="end"
          trigger={
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-hover">
              <WorkspaceAvatar name={user.name || user.email} />
              <span className="sr-only">Account menu</span>
            </span>
          }
        >
          {() => (
            <>
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-text">
                  {user.name || "You"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {org.memberCount} member{org.memberCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="my-1 h-px bg-divider" />
              <SignOutButton />
            </>
          )}
        </Dropdown>
      </header>

      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex border-t border-divider bg-sidebar",
          "pb-[env(safe-area-inset-bottom)] lg:hidden",
        )}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                "transition-colors",
                active
                  ? "text-text"
                  : "text-text-secondary hover:text-text",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
