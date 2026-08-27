import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { requireCurrentOrg } from "@/lib/org";
import { prisma } from "@/lib/db";
import { abilitiesForOrgRole } from "@/lib/permissions";
import { MemberList } from "@/components/organization/member-list";
import { InviteButton } from "@/components/organization/invite-button";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const current = await requireCurrentOrg();
  const abilities = abilitiesForOrgRole(current.role);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: current.organization.id },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      userId: true,
      role: true,
      createdAt: true,
    },
  });

  const profiles = await prisma.userProfile.findMany({
    where: { id: { in: members.map((m) => m.userId) } },
    select: { id: true, name: true, email: true },
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const rows = members.map((m) => ({
    userId: m.userId,
    role: m.role,
    name: profileById.get(m.userId)?.name ?? "",
    email: profileById.get(m.userId)?.email ?? "",
    you: m.userId === user.id,
  }));

  return (
    <div className="flex h-dvh flex-col">
      <header className="px-12 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text">Members</h1>
        <p className="mt-1 text-sm text-text-secondary">
          People in {current.organization.name}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-12 pb-12">
        <div className="mb-4 flex justify-end">
          {abilities.inviteMembers ? (
            <InviteButton organizationId={current.organization.id} />
          ) : null}
        </div>
        <MemberList
          members={rows}
          currentUserId={user.id}
          canRemove={abilities.removeMembers}
          organizationId={current.organization.id}
        />
      </div>
    </div>
  );
}
