import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/** The signed-in Supabase user, or null. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Auth user + UserProfile row, creating the profile on first sight so Prisma
 * joins against real rows even though auth lives in another schema.
 */
export const getUser = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const email = user.email ?? "";
  const name =
    (user.user_metadata["full_name"] as string | undefined) ??
    email.split("@")[0];

  return prisma.userProfile.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email, name },
  });
});

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;
