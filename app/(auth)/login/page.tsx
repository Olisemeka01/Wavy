import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-accent hover:underline">
            Create one
          </a>
        </>
      }
    >
      <LoginForm linkExpired={error === "link_expired"} />
    </AuthCard>
  );
}
