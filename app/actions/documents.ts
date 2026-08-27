"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getOrgRole } from "@/lib/org";
import { getDocumentWithAccess } from "@/lib/documents";
import { orgRoleAtLeast } from "@/lib/permissions";

export async function createDocument(organizationId: string): Promise<string> {
  const user = await requireUser();
  const role = await getOrgRole(user.id, organizationId);
  if (!orgRoleAtLeast(role ?? null, "MEMBER")) throw new Error("FORBIDDEN");

  const document = await prisma.document.create({
    data: {
      organizationId,
      createdById: user.id,
      isOrgWide: true, // docs start visible to the whole workspace
    },
  });

  revalidatePath("/documents");
  return `/documents/${document.id}`;
}

export type ContentPatch = {
  title?: string;
  icon?: string | null;
  content?: Prisma.InputJsonValue;
};

/** Autosave target for the editor: only someone with edit access gets through. */
async function updateDocumentContent(
  documentId: string,
  patch: ContentPatch,
): Promise<{ savedAt?: string; error?: string }> {
  const user = await requireUser();
  const found = await getDocumentWithAccess(user.id, documentId);

  if (!found) return { error: "forbidden" };
  if (!found.access.canEdit) return { error: "read_only" };

  const document = await prisma.document.update({
    where: { id: documentId },
    data: patch,
    select: { updatedAt: true },
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  return { savedAt: document.updatedAt.toISOString() };
}

/** Called by the editor with the full TipTap JSON doc. */
export async function saveDocument(
  documentId: string,
  input: {
    title?: string;
    icon?: string | null;
    content?: Prisma.InputJsonValue;
  },
) {
  return updateDocumentContent(documentId, input);
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const found = await getDocumentWithAccess(user.id, documentId);
  if (!found) throw new Error("NOT_FOUND");

  // Creator or a workspace owner/admin can remove a document.
  const canDelete =
    found.document.createdById === user.id || orgRoleAtLeast(found.orgRole, "ADMIN");
  if (!canDelete) throw new Error("FORBIDDEN");

  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/documents");
  redirect("/documents");
}
