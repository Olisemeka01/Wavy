import type { DocRole, OrgDocAccess, OrgRole } from "@/app/generated/prisma/client";

/**
 * Pure permission logic. Every server action checks here BEFORE touching data —
 * the UI is never trusted. All functions take ids, not objects, so callers can't
 * hand in stale records; they're combined with a single Prisma lookup per action.
 */

const ORG_RANK: Record<OrgRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export function orgRoleAtLeast(role: OrgRole | null, min: OrgRole): boolean {
  return role !== null && ORG_RANK[role] >= ORG_RANK[min];
}

export type OrgAbility = {
  /** Read any document in the org (default org-wide visibility). */
  viewDocuments: boolean;
  /** Create documents and edit those shared with them. */
  createDocuments: boolean;
  /** Invite members (OWNER/ADMIN). */
  inviteMembers: boolean;
  /** Remove non-owner members (OWNER/ADMIN). */
  removeMembers: boolean;
  /** Rename or delete the org, change member roles (OWNER only). */
  administerOrganization: boolean;
};

export function abilitiesForOrgRole(role: OrgRole): OrgAbility {
  return {
    viewDocuments: true,
    createDocuments: true,
    inviteMembers: orgRoleAtLeast(role, "ADMIN"),
    removeMembers: orgRoleAtLeast(role, "ADMIN"),
    administerOrganization: role === "OWNER",
  };
}

/**
 * Effective access to one document:
 * - org membership is required for any access;
 * - the creator always has full access;
 * - the OWNER sees and edits every doc in the org, even unshared ones;
 * - an explicit DocumentPermission wins over the org default;
 * - absence of a permission row means "org default" (visibility + access level).
 */
export type DocumentAccess =
  | { canView: true; canEdit: true; reason: "creator" }
  | { canView: true; canEdit: true; reason: "owner" }
  | { canView: true; canEdit: boolean; reason: "granted"; granted: DocRole }
  | { canView: true; canEdit: boolean; reason: "org" }
  | { canView: false; canEdit: false };

export function accessForDocument(input: {
  userId: string;
  docCreatedById: string;
  isOrgWide: boolean;
  orgAccess: OrgDocAccess;
  orgRole: OrgRole | null;
  permission?: { userId: string; role: DocRole } | null;
}): DocumentAccess {
  const { userId, docCreatedById, isOrgWide, orgAccess, orgRole, permission } =
    input;

  if (!orgRole) return { canView: false, canEdit: false };

  if (docCreatedById === userId) {
    return { canView: true, canEdit: true, reason: "creator" };
  }

  // Owners see and edit everything in the workspace, private or not.
  if (orgRoleAtLeast(orgRole, "OWNER")) {
    return { canView: true, canEdit: true, reason: "owner" };
  }

  if (permission && permission.userId === userId) {
    return {
      canView: true,
      canEdit: permission.role === "EDITOR",
      reason: "granted",
      granted: permission.role,
    };
  }

  // Org default: everyone in the org can view org-wide documents, and edit
  // them unless the workspace access is read-only…
  if (isOrgWide) {
    return {
      canView: true,
      canEdit: orgAccess === "EDIT",
      reason: "org",
    };
  }

  // …otherwise the document is invisible unless explicitly shared.
  return { canView: false, canEdit: false };
}
