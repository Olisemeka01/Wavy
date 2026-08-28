"use server";

import { revalidatePath } from "next/cache";
import type { OrgRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getOrgRole } from "@/lib/org";
import { orgRoleAtLeast } from "@/lib/permissions";

const INVITE_TTL_DAYS = 7;

export async function removeMember(
  organizationId: string,
  targetUserId: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const role = await getOrgRole(user.id, organizationId);
  if (!orgRoleAtLeast(role ?? null, "ADMIN")) {
    return { error: "Only owners and admins can remove members." };
  }

  const target = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
    select: { role: true },
  });
  if (!target) return { error: "This person is not a member." };
  if (target.role === "OWNER") {
    return { error: "The workspace owner can't be removed." };
  }
  if (targetUserId === user.id) {
    return { error: "You can't remove yourself. Ask the owner to." };
  }

  await prisma.organizationMember.delete({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
  });

  revalidatePath("/organization/members");
  return {};
}

export async function updateMemberRole(
  organizationId: string,
  targetUserId: string,
  role: OrgRole,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const callerRole = await getOrgRole(user.id, organizationId);
  if (!orgRoleAtLeast(callerRole ?? null, "OWNER")) {
    return { error: "Only the workspace owner can change roles." };
  }

  if (role !== "ADMIN" && role !== "MEMBER") {
    return { error: "Role must be admin or member." };
  }

  const target = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
    select: { role: true },
  });
  if (!target) return { error: "This person is not a member." };
  if (target.role === "OWNER") {
    return { error: "The workspace owner's role can't be changed." };
  }
  if (targetUserId === user.id) {
    return { error: "You can't change your own role." };
  }

  await prisma.organizationMember.update({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
    data: { role },
  });

  revalidatePath("/organization/members");
  return {};
}

export async function createInvitation(
  organizationId: string,
  email: string,
  role: OrgRole,
): Promise<{ token?: string; error?: string }> {
  const user = await requireUser();
  const callerRole = await getOrgRole(user.id, organizationId);
  if (!orgRoleAtLeast(callerRole ?? null, "ADMIN")) {
    return { error: "Only owners and admins can invite people." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Already a member?
  const existingProfile = await prisma.userProfile.findFirst({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingProfile) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: existingProfile.id,
        },
      },
      select: { id: true },
    });
    if (existingMembership) {
      return {
        error: `${normalizedEmail} is already a member of this workspace.`,
      };
    }
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId,
      email: normalizedEmail || null,
      // Invites never hand over ownership directly.
      role: role === "OWNER" ? "ADMIN" : role,
      token: crypto.randomUUID().replace(/-/g, ""),
      expiresAt,
    },
  });

  revalidatePath("/organization/members");
  return { token: invitation.token };
}
