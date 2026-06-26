// ENSNAKE affiliate system — seed script (intentionally empty).
//
// This project ships with NO demo data. All accounts and activity are created
// by real users through the signup flow and the main platform's referral
// attribution.
//
// To reset the database to a clean state, run:
//   bun run db:push   (recreates tables)
//
// The first account that signs up with an email listed in ADMIN_SIGNUP_EMAILS
// (see src/lib/constants.ts) is automatically promoted to admin role.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("No seed data — the database starts empty.");
  console.log("Sign up at / to create your first account.");
  console.log("Tip: sign up with support@esnaked.com to become an admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
