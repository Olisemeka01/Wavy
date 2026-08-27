import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-border bg-page px-2.5 text-sm text-text",
        "placeholder:text-text-placeholder focus-visible:border-accent",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/40",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/40",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
