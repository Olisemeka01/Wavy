import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { DocumentEditor } from "@/components/documents/document-editor";

type PageProps = { params: Promise<{ documentId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { documentId } = await params;
  const user = await getUser();
  if (!user) return {};
  const found = await getDocumentWithAccess(user.id, documentId);
  return { title: found?.document.title || "Untitled" };
}

export default async function DocumentPage({ params }: PageProps) {
  const { documentId } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const found = await getDocumentWithAccess(user.id, documentId);
  // Covers both nonexistent docs and ones revoked for this viewer.
  if (!found) notFound();

  return (
    <DocumentEditor
      id={found.document.id}
      initialTitle={found.document.title}
      initialIcon={found.document.icon}
      initialContent={found.document.content}
      canEdit={found.access.canEdit}
    />
  );
}
