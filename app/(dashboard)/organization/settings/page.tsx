import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { requireCurrentOrg } from "@/lib/org";
import { abilitiesForOrgRole } from "@/lib/permissions";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function OrganizationSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const current = await requireCurrentOrg();
  const abilities = abilitiesForOrgRole(current.role);

  return (
    <div className="flex h-dvh flex-col">
      <header className="px-12 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {current.organization.name}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-12 pb-12">
        <div className="max-w-md rounded-lg border border-border p-6">
          <OrgSettingsForm
            organizationId={current.organization.id}
            initialName={current.organization.name}
            canManage={abilities.administerOrganization}
          />
        </div>
      </div>
    </div>
  );
}
