/**
 * Demo data for a registered account.
 *
 * Register the user in the app first (auth lives in Supabase, so we can't
 * create the login here), then run:
 *
 *   npx tsx prisma/seed.ts you@example.com
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Usage: npx tsx prisma/seed.ts <registered-email>");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const profile = await prisma.userProfile.findFirst({ where: { email } });
  if (!profile) {
    console.error(
      `No user found for ${email}. Register this account in the app first, then re-run.`,
    );
    process.exit(1);
    return;
  }

  const existing = await prisma.organizationMember.findFirst({
    where: { userId: profile.id },
  });
  if (existing) {
    console.log("This account already has demo data. Nothing to do.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: "Wavy Demo",
      slug: `wavy-demo-${crypto.randomUUID().slice(0, 8)}`,
      createdById: profile.id,
      members: { create: { userId: profile.id, role: "OWNER" } },
      documents: {
        createMany: {
          data: [
            {
              title: "Welcome to Wavy",
              icon: "🌊",
              createdById: profile.id,
              isOrgWide: true,
              content: {
                type: "doc",
                content: [
                  { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome" }] },
                  { type: "paragraph", content: [{ type: "text", text: "This page was created by the seed script." }] },
                ],
              },
            },
            {
              title: "Roadmap",
              icon: "🚀",
              createdById: profile.id,
              isOrgWide: true,
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Seed content." }] },
                ],
              },
            },
          ],
        },
      },
    },
  });

  console.log(`Seeded workspace "${org.name}" for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
