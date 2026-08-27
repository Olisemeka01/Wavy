import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 text-center">
      <h1 className="mb-2 text-lg font-semibold text-text">
        This page doesn&apos;t exist
      </h1>
      <p className="mb-5 max-w-xs text-sm text-text-secondary">
        It may have been deleted, or you don&apos;t have access to it.
      </p>
      <Link
        href="/documents"
        className="inline-flex h-8 items-center rounded-md border border-border px-3.5 text-sm font-medium text-text hover:bg-hover"
      >
        Back to documents
      </Link>
    </div>
  );
}
