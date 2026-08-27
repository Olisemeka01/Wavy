export function AuthCard({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h1 className="mb-5 text-center text-lg font-semibold text-text">
        {title}
      </h1>
      <div className="rounded-lg border border-border bg-page p-6">
        {children}
      </div>
      {footer ? (
        <p className="mt-4 text-center text-sm text-text-secondary">{footer}</p>
      ) : null}
    </section>
  );
}
