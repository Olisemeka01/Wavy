"use client";

import { useState } from "react";
import { CreateOrgModal } from "@/components/organization/create-org-modal";
import { SignOutButton } from "@/components/sidebar/sidebar";
import { Button } from "@/components/ui/button";

/** First login with no workspace: creating one is the only way forward. */
export function CreateOrgGate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-page px-4">
      <h1 className="mb-2 text-xl font-semibold text-text">
        Create your workspace
      </h1>
      <p className="mb-6 max-w-xs text-center text-sm text-text-secondary">
        A workspace holds your team&apos;s documents and members.
      </p>
      <Button onClick={() => setOpen(true)} className="h-9 px-4">
        Create a workspace
      </Button>

      <div className="mt-10">
        <SignOutButton />
      </div>

      {/* Once open, creating a workspace is the only way forward. */}
      <CreateOrgModal open={open} dismissible={!open} onClose={() => {}} />
    </div>
  );
}

