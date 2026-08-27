"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, UserPlusIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/input";
import { createInvitation } from "@/app/actions/members";

export function InviteButton({
  organizationId,
  variant = "primary",
}: {
  organizationId: string;
  variant?: ButtonProps["variant"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <UserPlusIcon className="size-4" /> Invite
      </Button>
      <InviteModal
        open={open}
        onClose={() => setOpen(false)}
        organizationId={organizationId}
      />
    </>
  );
}

function InviteModal({
  open,
  onClose,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function closeAndReset() {
    onClose();
    setLink(null);
    setError(null);
    setEmail("");
    setRole("MEMBER");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createInvitation(organizationId, email, role);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLink(`${window.location.origin}/invite/${result.token}`);
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying failed. Select the link and copy it manually.");
    }
  }

  return (
    <Modal open={open} onClose={closeAndReset} title="Invite to workspace">
      {!link ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
          <Field label="Email" htmlFor="invite-email">
            <Input
              id="invite-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
          <p className="-mt-2 text-xs text-text-secondary">
            Optional. Restricts the link to this address.
          </p>

          <Field label="They join as" htmlFor="invite-role">
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
              className="h-9 rounded-md border border-border bg-page px-2 text-sm text-text focus-visible:border-accent focus-visible:outline-none"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create invite link"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          <Field label="Share this link" htmlFor="invite-link">
            <Input id="invite-link" readOnly value={link} />
          </Field>
          <p className="-mt-2 text-xs text-text-secondary">
            Works for one person and expires in 7 days.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={copyLink}>
              {copied ? (
                <>
                  <CheckIcon className="size-4 text-accent" /> Copied
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" /> Copy link
                </>
              )}
            </Button>
            <Button onClick={closeAndReset}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
