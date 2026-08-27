import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Check your email" };

export default async function ConfirmSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="Check your email"
      footer={
        <>
          Wrong address?{" "}
          <a href="/register" className="text-accent hover:underline">
            Register again
          </a>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm text-text-secondary">
        <p>
          To finish creating your account, open the link we sent to{" "}
          <b className="font-medium text-text">{email}</b>.
        </p>
        <p>Didn&apos;t get anything? Check your spam folder.</p>
      </div>
    </AuthCard>
  );
}
