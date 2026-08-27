"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): AuthState | null {
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter an email address like name@example.com" };
  }
  if (password.length < 8) {
    return { error: "Choose a password with at least 8 characters" };
  }
  return null;
}

/** Register. When Supabase email confirmation is on, asks the user to check their inbox. */
export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const invalid = validate(email, password);
  if (invalid) return invalid;

  const name = String(formData.get("name") ?? "").trim();
  const next = safeNext(formData);

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return {
        error: "An account with this email already exists. Try signing in.",
      };
    }
    return { error: "Unable to create your account. Try again in a moment." };
  }

  // Email confirmation enabled: no session yet.
  if (!data.session) {
    redirect(`/register/confirm?email=${encodeURIComponent(email)}`);
  }

  redirect("/documents");
}

function safeNext(raw: FormData | null): string | null {
  const next = raw?.get("next");
  if (typeof next !== "string") return null;
  // Only allow in-app paths — never an open redirect.
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData);

  if (!email || !password) {
    return { error: "Enter your email and password to sign in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Email or password is incorrect.",
    };
  }

  redirect(next ?? "/documents");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
