import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AcceptInviteForm } from "@/components/organization/accept-invite-form";

export const metadata: Metadata = { title: "Join workspace" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUser();

  // Not signed in: log in or register first, then come back here.
  if (!user) {
    return <SignInFirst token={token} />;
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation) notFound();

  const expired = invitation.expiresAt < new Date();
  const used =
    Boolean(invitation.acceptedAt) || Boolean(invitation.acceptedById);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4">
      <main className="w-full max-w-[360px] rounded-lg border border-border bg-page p-6">
        <h1 className="mb-1 text-lg font-semibold text-text">
          Join {invitation.organization.name}
        </h1>
        {!expired && !used ? (
          <>
            <p className="mb-5 text-sm text-text-secondary">
              You&apos;ve been invited as{" "}
              <b className="font-medium text-text">{invitation.role.toLowerCase()}</b>.
            </p>
            <AcceptInviteForm token={token} />
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            This invite link is no longer valid.
            <br />
            Ask a workspace admin to send a new one.
          </p>
        )}
      </main>
    </div>
  );
}

function SignInFirst({ token }: { token: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4">
      <main className="w-full max-w-[360px] rounded-lg border border-border bg-page p-6 text-sm text-text-secondary">
        <p>
          Sign in to accept this invitation. Then open the link again to join
          your team&apos;s workspace.
        </p>
        <a
          href={`/login?next=/invite/${token}`}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-accent px-3.5 font-medium text-white hover:bg-accent-hover"
        >
          Sign in
        </a>
      </main>
    </div>
  );
}
