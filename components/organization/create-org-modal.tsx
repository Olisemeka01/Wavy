"use client";

import { useActionState } from "react";
import { createOrganization, type ActionState } from "@/app/actions/org";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function CreateOrgModal({
  open,
  onClose,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createOrganization,
    {},
  );

  // The action redirects on success; cancel/error handling stays client-side.
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a workspace"
      dismissible={dismissible}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field
          label="Workspace name"
          htmlFor="org-name"
          hint="A home for your team's documents — e.g. Acme Inc or Weekend project."
        >
          <Input
            id="org-name"
            name="name"
            placeholder="Acme Inc"
            required
            autoFocus
            invalid={Boolean(state.error)}
          />
        </Field>

        {state.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          {dismissible ? (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
