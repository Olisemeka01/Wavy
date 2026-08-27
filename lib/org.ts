import { cookies } from "next/headers";
import { cache } from "react";
import type { Organization, OrgRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

const CURRENT_ORG_COOKIE = "wavy-current-org";

export type Membership = {
  organization: Organization & { memberCount: number };
  role: OrgRole;
};

/** Every org the signed-in user belongs to. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getUser();
  if (!user) return [];

  const rows = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    organization: {
      ...row.organization,
      memberCount: row.organization._count.members,
    },
    role: row.role,
  }));
});

export type OrgWithCount = Membership["organization"] & { memberCount: number };

/**
 * The org whose context the app renders right now:
 * the last one selected (cookie), or the oldest membership.
 */
export async function getCurrentMembership(): Promise<Membership | null> {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const store = await cookies();
  const selectedId = store.get(CURRENT_ORG_COOKIE)?.value;
  if (selectedId) {
    const found = memberships.find((m) => m.organization.id === selectedId);
    if (found) return found;
  }
  return memberships[0]!;
}

/** Org + caller's role after verifying they're a member at all. */
export async function requireCurrentOrg(): Promise<Membership> {
  const membership = await getCurrentMembership();
  if (!membership) throw new Error("NO_ORGANIZATION");
  return membership;
}

/** Membership for an arbitrary org id — the gate for every cross-org check. */
export async function getOrgRole(
  userId: string,
  organizationId: string,
): Promise<OrgRole | null> {
  const row = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  return row?.role ?? null;
}
