"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Borderless-depth dialog: overlay dim + border + surface contrast,
 * never a shadow. Traps focus and restores it on close.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "sm:max-w-md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  dismissible?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Latest-ref pattern so the effect below can run only when `open` changes —
  // otherwise a re-render (e.g. each keystroke in a form) re-focuses the panel.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  // Focus trap: keep Tab cycling inside the panel.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

    const first = focusables()[0];
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissibleRef.current) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;

      const active = document.activeElement as HTMLElement;
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;

      if (event.shiftKey && active === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={
        dismissible ? (e) => e.target === e.currentTarget && onClose() : undefined
      }
    >
      <div className="absolute inset-0 bg-text/20" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-lg border border-border bg-page",
          width,
        )}
      >
        <header className="flex h-12 items-center justify-between pl-4">
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-text-secondary",
                "cursor-pointer hover:bg-hover hover:text-text",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              <XIcon className="size-5" />
            </button>
          ) : null}
        </header>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
