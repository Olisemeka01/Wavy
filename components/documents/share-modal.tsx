"use client";

import { useEffect, useState } from "react";
import {
  getSharingInfo,
  setOrgWideAccess,
  removeUserPermission,
  setUserPermission,
} from "@/app/actions/sharing";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

export function ShareModal({
  documentId,
  open,
  onClose,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<Awaited<
    ReturnType<typeof getSharingInfo>
  > | null>(null);

  // (Re)load sharing data whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSharingInfo(documentId).then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, documentId]);

  async function updateRow(
    userId: string,
    role: "EDITOR" | "VIEWER" | null,
  ) {
    if (role === null) {
      await removeUserPermission(documentId, userId);
    } else {
      await setUserPermission(documentId, userId, role);
    }
    setInfo(await getSharingInfo(documentId));
  }

  return (
    <Modal open={open} onClose={onClose} title="Share this page">
      {!info ? (
        <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
          Loading…
        </div>
      ) : (
        <ShareForm
          info={info}
          onToggleOrgWide={async (enabled) => {
            await setOrgWideAccess(documentId, enabled);
            setInfo(await getSharingInfo(documentId));
          }}
          onUpdateRow={updateRow}
        />
      )}
    </Modal>
  );
}

function ShareForm({
  info,
  onToggleOrgWide,
  onUpdateRow,
}: {
  info: NonNullable<Awaited<ReturnType<typeof getSharingInfo>>>;
  onToggleOrgWide: (enabled: boolean) => Promise<void>;
  onUpdateRow: (userId: string, userRole: "EDITOR" | "VIEWER" | null) => Promise<void>;
}) {
  const manage = info.manageable;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <label className="flex items-center justify-between gap-3 text-sm text-text">
        <span>
          Share with{" "}
          {info.isOrgWide
            ? "everyone in this workspace"
            : "specific people only"}
        </span>
        <input
          type="checkbox"
          checked={info.isOrgWide}
          disabled={!manage}
          onChange={(e) => onToggleOrgWide(e.target.checked)}
          className="size-4 accent-[var(--color-accent)] cursor-pointer"
        />
      </label>

      {manage && !info.isOrgWide ? (
        <p className="text-xs text-text-secondary">
          Only people listed below can open this page. Workspace members can be
          granted view or edit rights here once they&apos;ve joined the
          workspace.
        </p>
      ) : null}

      <ul className="flex flex-col">
        {info.rows.map((row) => (
          <li
            key={row.userId}
            className="flex items-center justify-between gap-3 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar name={row.name || row.email} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text">
                  {row.name || row.email}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {row.role === "CREATOR" ? "Creator" : ""}
                </span>
              </span>
            </span>

            {manage && row.role !== "CREATOR" ? (
              <select
                aria-label={`Access for ${row.name || row.email}`}
                value={row.role}
                onChange={(e) =>
                  onUpdateRow(
                    row.userId,
                    e.target.value === "NONE"
                      ? null
                      : (e.target.value as "EDITOR" | "VIEWER"),
                  )
                }
                className={cn(
                  "h-7 rounded-md border border-border bg-page px-1.5 text-xs text-text",
                  "focus-visible:border-accent focus-visible:outline-none",
                )}
              >
                <option value="VIEWER">Can view</option>
                <option value="EDITOR">Can edit</option>
                <option value="NONE">Remove</option>
              </select>
            ) : (
              <span className="text-xs text-text-secondary capitalize">
                {row.role.toLowerCase()}
              </span>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-sidebar text-xs font-medium text-text">
      {letter}
    </span>
  );
}
