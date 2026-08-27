"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { orgRoleAtLeast } from "@/lib/permissions";

export type SharingRow = {
  userId: string;
  name: string;
  email: string;
  role: "EDITOR" | "VIEWER" | "CREATOR";
};

/**
 * Who may change sharing settings: the doc's creator or an OWNER/ADMIN.
 * Plain EDITORs write content, not access rules.
 */
function canManage(orgRole: "OWNER" | "ADMIN" | "MEMBER", createdById: string, userId: string) {
  return createdById === userId || orgRoleAtLeast(orgRole, "ADMIN");
}

/** Admin surface behind the ShareModal. Returns null without view access. */
export async function getSharingInfo(documentId: string) {
  const user = await requireUser();
  const found = await getDocumentWithAccess(user.id, documentId);
  if (!found) return null;

  const { document } = found;
  const manageable = canManage(found.orgRole, document.createdById, user.id);

  const permissions = await prisma.documentPermission.findMany({
    where: { documentId },
    select: { userId: true, role: true },
  });

  // Org members who can see this page: explicit grants plus the creator.
  const userIds = [...new Set([document.createdById, ...permissions.map((p) => p.userId)])];
  const profiles = await prisma.userProfile.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const rows: SharingRow[] = userIds.map((userId) => {
    const grant = permissions.find((p) => p.userId === userId);
    return {
      userId,
      name: profileById.get(userId)?.name ?? "",
      email: profileById.get(userId)?.email ?? "",
      role:
        userId === document.createdById
          ? "CREATOR"
          : ((grant?.role ?? "VIEWER") as "EDITOR" | "VIEWER"),
    };
  });

  return {
    isOrgWide: document.isOrgWide,
    manageable,
    rows,
  };
}

async function assertManager(documentId: string) {
  const user = await requireUser();
  const found = await getDocumentWithAccess(user.id, documentId);
  if (!found || !canManage(found.orgRole, found.document.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  return found;
}

export async function setOrgWideAccess(
  documentId: string,
  isOrgWide: boolean,
) {
  await assertManager(documentId);
  await prisma.document.update({
    where: { id: documentId },
    data: { isOrgWide },
  });
  revalidatePath(`/documents/${documentId}`);
}

export async function setUserPermission(
  documentId: string,
  targetUserId: string,
  role: "EDITOR" | "VIEWER",
) {
  await assertManager(documentId);
  await prisma.documentPermission.upsert({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    update: { role },
    create: { documentId, userId: targetUserId, role },
  });
  revalidatePath(`/documents/${documentId}`);
}

export async function removeUserPermission(
  documentId: string,
  targetUserId: string,
) {
  await assertManager(documentId);
  await prisma.documentPermission.deleteMany({
    where: { documentId, userId: targetUserId },
  });
  revalidatePath(`/documents/${documentId}`);
}
