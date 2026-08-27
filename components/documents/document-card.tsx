import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type DocumentCardProps = {
  document: {
    id: string;
    title: string;
    icon: string | null;
    updatedAt: Date;
    createdById: string;
  };
  currentUserId: string;
};

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DocumentCard({ document, currentUserId }: DocumentCardProps) {
  const icon = document.icon;

  return (
    <Link
      href={`/documents/${document.id}`}
      className={cn(
        "flex h-full flex-col gap-2 rounded-md border border-border bg-page p-3 transition-colors hover:bg-hover",
      )}
    >
      <div className="text-2xl leading-none">
        {icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : (
          <FileTextIcon className="size-5 text-text-placeholder" aria-hidden="true" />
        )}
      </div>
      <h2 className="truncate text-sm font-medium text-text">
        {document.title || "Untitled"}
      </h2>
      <p className="mt-auto text-xs text-text-secondary">
        Edited {relativeTime(document.updatedAt)}
        {document.createdById === currentUserId ? " · by you" : ""}
      </p>
    </Link>
  );
}
