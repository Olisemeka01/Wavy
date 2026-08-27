import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import {
  getCurrentMembership,
  getMemberships,
} from "@/lib/org";
import { Sidebar } from "@/components/sidebar/sidebar";
import { CreateOrgGate } from "@/components/organization/create-org-gate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const memberships = await getMemberships();
  const current = memberships.length > 0 ? await getCurrentMembership() : null;

  // First login: no workspace yet — show the create-org gate.
  if (!current) {
    return <CreateOrgGate />;
  }

  return (
    <div className="flex h-dvh">
      <Sidebar current={current} memberships={memberships} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
