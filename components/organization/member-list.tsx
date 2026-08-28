"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { removeMember, updateMemberRole } from "@/app/actions/members";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { cn } from "@/lib/cn";

type MemberRow = {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  name: string;
  email: string;
  you: boolean;
};

const ASSIGNABLE_ROLES = ["ADMIN", "MEMBER"] as const;

export function MemberList({
  members,
  canRemove,
  canChangeRole,
  organizationId,
}: {
  members: MemberRow[];
  canRemove: boolean;
  canChangeRole: boolean;
  organizationId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);

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
            canChangeRole={canChangeRole}
            organizationId={organizationId}
            onRemove={() => setRemoving(m)}
            onError={setError}
          />
        ))}
      </ul>

      <RemoveMemberModal
        member={removing}
        organizationId={organizationId}
        onClose={() => setRemoving(null)}
        onError={setError}
      />
    </div>
  );
}

function RemoveMemberModal({
  member,
  organizationId,
  onClose,
  onError,
}: {
  member: MemberRow | null;
  organizationId: string;
  onClose: () => void;
  onError: (msg: string | null) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    if (!member) return;
    start(async () => {
      const result = await removeMember(organizationId, member.userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onError(null);
      setError(null);
      onClose();
    });
  }

  return (
    <Modal
      open={member !== null}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Remove member"
    >
      {member ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Remove{" "}
            <span className="font-medium text-text">
              {member.name || member.email}
            </span>{" "}
            from this workspace? They'll lose access to all of its documents.
          </p>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setError(null);
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Removing…" : "Remove member"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function MemberRowItem({
  member,
  canRemove,
  canChangeRole,
  organizationId,
  onRemove,
  onError,
}: {
  member: MemberRow;
  canRemove: boolean;
  canChangeRole: boolean;
  organizationId: string;
  onRemove: () => void;
  onError: (msg: string | null) => void;
}) {
  const [pending, start] = useTransition();

  function onRoleChange(role: (typeof ASSIGNABLE_ROLES)[number]) {
    start(async () => {
      const result = await updateMemberRole(organizationId, member.userId, role);
      onError(result.error ?? null);
    });
  }

  const canTargetThisMember = !member.you && member.role !== "OWNER";
  const canRemoveThisMember = canRemove && canTargetThisMember;
  const canChangeThisRole = canChangeRole && canTargetThisMember;

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
        <RoleBadge
          member={member}
          disabled={pending}
          onChange={canChangeThisRole ? onRoleChange : undefined}
        />
        {canRemoveThisMember ? (
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

function RoleBadge({
  member,
  disabled,
  onChange,
}: {
  member: MemberRow;
  disabled: boolean;
  onChange?: (role: (typeof ASSIGNABLE_ROLES)[number]) => void;
}) {
  const badge = (
    <span
      className={cn(
        "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        member.role === "OWNER"
          ? "border-accent text-accent"
          : "border-border text-text-secondary",
      )}
    >
      {member.role}
      {onChange ? (
        <ChevronDownIcon className="size-3 text-text-placeholder" />
      ) : null}
    </span>
  );

  if (!onChange) return badge;

  return (
    <Dropdown
      align="end"
      trigger={
        <span
          className={cn(
            "inline-flex cursor-pointer rounded-md transition-colors hover:bg-hover",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {badge}
        </span>
      }
    >
      {(close) =>
        ASSIGNABLE_ROLES.map((role) => (
          <DropdownItem
            key={role}
            disabled={role === member.role}
            onClick={() => {
              close();
              if (role !== member.role) onChange(role);
            }}
          >
            {role}
            {role === member.role ? (
              <span className="ml-auto text-xs text-text-placeholder">
                Current
              </span>
            ) : null}
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}
