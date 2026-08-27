"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { removeMember } from "@/app/actions/members";
import { cn } from "@/lib/cn";

type MemberRow = {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  name: string;
  email: string;
  you: boolean;
};

export function MemberList({
  members,
  canRemove,
  organizationId,
}: {
  members: MemberRow[];
  currentUserId: string;
  canRemove: boolean;
  organizationId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-divider">
        {members.map((m) => (
          <MemberRowItem
            key={m.userId}
            member={m}
            canRemove={canRemove}
            organizationId={organizationId}
            onError={setError}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberRowItem({
  member,
  canRemove,
  organizationId,
  onError,
}: {
  member: MemberRow;
  canRemove: boolean;
  organizationId: string;
  onError: (msg: string | null) => void;
}) {
  const [pending, start] = useTransition();

  function onRemove() {
    start(async () => {
      const result = await removeMember(organizationId, member.userId);
      onError(result.error ?? null);
    });
  }

  const canTargetThisMember = canRemove && !member.you && member.role !== "OWNER";

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-sidebar text-sm font-medium text-text">
          {(member.name || member.email).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-text">
            {member.name || member.email}
            {member.you ? " (you)" : ""}
          </span>
          <span className="block truncate text-xs text-text-secondary">
            {member.email}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            member.role === "OWNER"
              ? "border-accent text-accent"
              : "border-border text-text-secondary",
          )}
        >
          {member.role}
        </span>
        {canTargetThisMember ? (
          <button
            type="button"
            aria-label={`Remove ${member.name || member.email}`}
            disabled={pending}
            onClick={onRemove}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-secondary hover:bg-danger/5 hover:text-danger disabled:pointer-events-none disabled:text-text-placeholder"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </span>
    </li>
  );
}
