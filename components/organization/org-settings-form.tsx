"use client";

import { useState, useTransition } from "react";
import {
  deleteOrganization,
  renameOrganization,
} from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function OrgSettingsForm({
  organizationId,
  initialName,
  canManage,
}: {
  organizationId: string;
  initialName: string;
  canManage: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, start] = useTransition();

  if (!canManage) {
    return (
      <p className="text-sm text-text-secondary">
        Only the workspace owner can change these settings.
      </p>
    );
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    start(async () => {
      const result = await renameOrganization(organizationId, name);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSave} className="flex flex-col gap-3">
        <Field label="Workspace name" htmlFor="ws-name">
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        {saved && !error ? (
          <p role="status" className="text-sm text-text-secondary">
            Saved.
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-3 border-t border-divider pt-6">
        <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
        <p className="text-sm text-text-secondary">
          Deleting the workspace removes every document and member record in
          it. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Delete workspace
        </Button>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this workspace?"
      >
        <div className="flex flex-col gap-4 pb-1">
          <p className="text-sm text-text-secondary">
            Every document, member and invite in{" "}
            <b className="font-medium text-text">{initialName}</b> will be
            permanently deleted.
          </p>
          <Field label="Type DELETE to confirm" htmlFor="confirm-delete">
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "DELETE" || pending}
              onClick={() =>
                start(async () => {
                  await deleteOrganization(organizationId);
                })
              }
            >
              {pending ? "Deleting…" : "Delete workspace"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
