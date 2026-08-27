import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <a href="/login" className="text-accent hover:underline">
            Sign in
          </a>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
