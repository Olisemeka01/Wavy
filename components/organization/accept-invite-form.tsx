"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onAccept() {
    start(async () => {
      const result = await acceptInvitation(token);
      if (result?.error) {
        setError(
          result.error === "expired"
            ? "This invite expired. Ask a workspace admin to send a new one."
            : result.error === "already_used"
              ? "This link was already used."
              : "This link is no longer valid.",
        );
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={onAccept} disabled={pending} className="h-9">
        {pending ? "Joining…" : "Join workspace"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
