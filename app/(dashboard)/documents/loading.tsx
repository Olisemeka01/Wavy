export default function DocumentsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Loading documents">
      <header className="flex items-center justify-between gap-3 px-4 pt-6 pb-6 sm:px-6 sm:pt-8 lg:px-12 lg:pt-12">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="h-7 w-44 animate-pulse rounded-md bg-hover" />
          <div className="h-4 w-60 max-w-full animate-pulse rounded-md bg-hover" />
        </div>
        <div className="h-8 w-32 shrink-0 animate-pulse rounded-md bg-hover" />
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-3 px-4 sm:px-6 lg:px-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-28 flex-col gap-3 rounded-md border border-border p-3"
          >
            <div className="size-6 animate-pulse rounded-sm bg-hover" />
            <div className="h-4 w-3/4 animate-pulse rounded-md bg-hover" />
            <div className="mt-auto h-3 w-1/3 animate-pulse rounded-md bg-hover" />
          </div>
        ))}
      </div>
    </div>
  );
}
