"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getOrgRole } from "@/lib/org";
import { orgRoleAtLeast } from "@/lib/permissions";

export type ActionState = { error?: string };

const CURRENT_ORG_COOKIE = "wavy-current-org";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "workspace"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  // The uuid suffix makes collisions vanishingly rare; keep it short for URLs.
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give your workspace a name." };

  const organization = await prisma.organization.create({
    data: {
      name,
      slug: await uniqueSlug(slugify(name)),
      createdById: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  const store = await cookies();
  store.set(CURRENT_ORG_COOKIE, organization.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/documents");
}

/** Switch the sidebar's active workspace. */
export async function switchOrganization(organizationId: string) {
  const user = await requireUser();
  const role = await getOrgRole(user.id, organizationId);
  if (!role) return;

  const store = await cookies();
  store.set(CURRENT_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
}

export async function renameOrganization(
  organizationId: string,
  name: string,
): Promise<ActionState> {
  const user = await requireUser();
  const role = await getOrgRole(user.id, organizationId);
  const trimmed = name.trim();

  if (!orgRoleAtLeast(role ?? null, "OWNER")) {
    return { error: "Only the workspace owner can rename it." };
  }
  if (!trimmed) return { error: "Give your workspace a name." };

  await prisma.organization.update({
    where: { id: organizationId },
    data: { name: trimmed },
  });

  revalidatePath("/", "layout");
  return {};
}

export async function deleteOrganization(organizationId: string) {
  const user = await requireUser();
  const role = await getOrgRole(user.id, organizationId);
  if (!orgRoleAtLeast(role ?? null, "OWNER")) return;

  await prisma.organization.delete({ where: { id: organizationId } });
  revalidatePath("/", "layout");
  redirect("/documents");
}
