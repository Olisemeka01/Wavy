"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const CURRENT_ORG_COOKIE = "wavy-current-org";

export type AcceptResult = {
  error?: "not_found" | "expired" | "already_used";
};

/** Join the org an invite link points at. Consumes the token once. */
export async function acceptInvitation(token: string): Promise<AcceptResult> {
  const user = await requireUser();

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      organizationId: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      acceptedById: true,
      email: true,
    },
  });

  if (!invitation) return { error: "not_found" };
  if (invitation.acceptedAt || invitation.acceptedById) {
    return { error: "already_used" };
  }
  if (invitation.expiresAt < new Date()) return { error: "expired" };

  // Invite addressed to a specific address only works for that account.
  if (
    invitation.email &&
    invitation.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return {
      error: "not_found",
    };
  }

  // Join without downgrading an existing role.
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
      },
    });
  }

  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { acceptedById: user.id, acceptedAt: new Date() },
  });

  const store = await cookies();
  store.set(CURRENT_ORG_COOKIE, invitation.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/documents");
}
