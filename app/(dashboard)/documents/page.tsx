import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { requireCurrentOrg } from "@/lib/org";
import { listVisibleDocuments } from "@/lib/documents";
import { DocumentCard } from "@/components/documents/document-card";
import { NewDocumentButton } from "@/components/documents/new-document-button";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const current = await requireCurrentOrg();
  const documents = await listVisibleDocuments(
    current.organization.id,
    user.id,
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-12 pt-12 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Documents
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Recently updated in {current.organization.name}
          </p>
        </div>
        <NewDocumentButton organizationId={current.organization.id} />
      </header>

      <div className="flex-1 overflow-y-auto px-12 pb-12">
        {documents.length === 0 ? (
          <div className="flex max-w-sm flex-col items-start gap-1 rounded-lg border border-border p-8">
            <h2 className="font-medium text-text">No documents yet</h2>
            <p className="mb-3 text-sm text-text-secondary">
              Documents hold notes, specs and plans for your team.
            </p>
            <NewDocumentButton
              variant="outline"
              organizationId={current.organization.id}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {documents.map((doc) => (
              <li key={doc.id}>
                <DocumentCard document={doc} currentUserId={user.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
