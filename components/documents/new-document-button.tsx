"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePlusIcon, Loader2Icon } from "lucide-react";
import { createDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

export function NewDocumentButton({
  organizationId,
  variant = "primary",
}: {
  organizationId: string;
  variant?: ButtonProps["variant"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function create() {
    setBusy(true);
    startTransition(async () => {
      const href = await createDocument(organizationId);
      router.push(href);
    });
  }

  return (
    <Button variant={variant} onClick={create} disabled={pending || busy}>
      {pending || busy ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <FilePlusIcon className="size-4" />
      )}
      New document
    </Button>
  );
}
