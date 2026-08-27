"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm({
  linkExpired,
  next,
}: {
  linkExpired?: boolean;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Preserved so the action returns the user to where they started. */}
      <input type="hidden" name="next" value={next ?? ""} />

      {linkExpired ? (
        <p role="status" className="text-sm text-text-secondary">
          That sign-in link expired. Sign in with your email and password.
        </p>
      ) : null}

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          invalid={Boolean(state.error)}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-1 h-9 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
