import { cache } from "react";
import type {
  Document,
  DocumentPermission,
  OrgRole,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { accessForDocument, type DocumentAccess } from "@/lib/permissions";

export const getDocumentWithAccess = cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<{
    document: Document;
    orgRole: OrgRole;
    access: DocumentAccess;
    permission?: DocumentPermission | null;
  } | null> => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { organization: true },
    });
    if (!document) return null;

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: document.organizationId,
          userId,
        },
      },
      select: { role: true },
    });
    if (!membership) return null;

    const permission = await prisma.documentPermission.findUnique({
      where: { documentId_userId: { documentId, userId } },
    });

    const access = accessForDocument({
      userId,
      docCreatedById: document.createdById,
      isOrgWide: document.isOrgWide,
      orgRole: membership.role,
      permission,
    });
    if (!access.canView) return null;

    return { document, orgRole: membership.role, access, permission };
  },
);

/** Documents inside one org that a member can actually see. */
export function listVisibleDocuments(organizationId: string, userId: string) {
  return prisma.document.findMany({
    where: {
      organizationId,
      OR: [
        { isOrgWide: true },
        { createdById: userId },
        { permissions: { some: { userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      icon: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
    },
  });
}
