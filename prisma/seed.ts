 
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeWagerEconomics } from "../src/lib/commission";

const db = new PrismaClient();

// Deterministic-ish PRNG for reproducible demo data
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20240901);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const DAYS = 30;

async function main() {
  console.log("Seeding ENSNAKE affiliate database...");

  // Wipe (order matters for FK constraints handled by onDelete: Cascade)
  await db.notification.deleteMany();
  await db.payout.deleteMany();
  await db.withdrawal.deleteMany();
  await db.wager.deleteMany();
  await db.deposit.deleteMany();
  await db.referredUser.deleteMany();
  await db.click.deleteMany();
  await db.affiliate.deleteMany();
  await db.verificationToken.deleteMany();

  // --- Admin ---
  const adminPass = await bcrypt.hash("Admin@123", 10);
  const admin = await db.affiliate.create({
    data: {
      fullName: "ENSNAKE Admin",
      email: "admin@ensnake.com",
      username: "admin",
      passwordHash: adminPass,
      referralCode: "ADMIN",
      commissionPct: 0,
      status: "active",
      role: "admin",
      emailVerified: true,
    },
  });

  // --- Affiliates ---
  type SeedAff = {
    fullName: string;
    email: string;
    username: string;
    referralCode: string;
    commissionPct: number;
    platformName: string;
    bio: string;
  };
  const seeds: SeedAff[] = [
    {
      fullName: "Joshua Isok",
      email: "joshua@ensnake.com",
      username: "joshua",
      referralCode: "JOSHUA",
      commissionPct: 20,
      platformName: "TikTok",
      bio: "Gaming creator streaming crash games & live plays.",
    },
    {
      fullName: "Amara Okafor",
      email: "amara@ensnake.com",
      username: "amara",
      referralCode: "AMARA",
      commissionPct: 25,
      platformName: "YouTube",
      bio: "Slots & casino streamer, 120k subscribers.",
    },
    {
      fullName: "Daniel Mensah",
      email: "daniel@ensnake.com",
      username: "daniel",
      referralCode: "DANMEN",
      commissionPct: 18,
      platformName: "Twitch",
      bio: "Variety gaming streamer focused on African audience.",
    },
    {
      fullName: "Zainab Yusuf",
      email: "zainab@ensnake.com",
      username: "zainab",
      referralCode: "ZAINAB",
      commissionPct: 20,
      platformName: "Instagram",
      bio: "Influencer promoting real-money skill games.",
    },
    {
      fullName: "Kwame Boateng",
      email: "kwame@ensnake.com",
      username: "kwame",
      referralCode: "KWAME",
      commissionPct: 15,
      platformName: "X (Twitter)",
      bio: "Crypto & gaming content creator.",
    },
    {
      fullName: "Lerato Nkosi",
      email: "lerato@ensnake.com",
      username: "lerato",
      referralCode: "LERATO",
      commissionPct: 22,
      platformName: "TikTok",
      bio: "Live casino & crash game creator.",
    },
  ];

  const affiliates = [];
  for (const s of seeds) {
    const pass = await bcrypt.hash(`${s.username.charAt(0).toUpperCase()}${s.username.slice(1)}@123`, 10);
    const aff = await db.affiliate.create({
      data: {
        fullName: s.fullName,
        email: s.email,
        username: s.username,
        passwordHash: pass,
        referralCode: s.referralCode,
        commissionPct: s.commissionPct,
        status: "active",
        role: "affiliate",
        emailVerified: true,
        platformName: s.platformName,
        bio: s.bio,
      },
    });
    affiliates.push(aff);
  }

  // Suspend one affiliate to show the admin suspend flow
  await db.affiliate.update({
    where: { id: affiliates[5].id },
    data: { status: "suspended" },
  });

  // --- For each affiliate: referred users, clicks, deposits, wagers over DAYS ---
  const banks = ["Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank", "Kuda Bank", "Opay", "Moniepoint"];
  const usernames1 = ["neon", "shadow", "vortex", "blaze", "phantom", "titan", "raven", "ace", "storm", "falcon", "echo", "volt", "rogue", "maverick", "onyx", "pulse"];
  const usernames2 = ["kid", "pro", "x", "ng", "hq", "zilla", "wave", "core", "byte", "fyre"];

  const now = new Date();

  for (const aff of affiliates) {
    // clicks per day
    for (let d = 0; d < DAYS; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() - (DAYS - 1 - d));
      const count = between(8, 60);
      for (let c = 0; c < count; c++) {
        await db.click.create({
          data: {
            affiliateId: aff.id,
            referralCode: aff.referralCode,
            ip: `41.58.${between(0, 255)}.${between(0, 255)}`,
            userAgent: pick(["Mozilla/5.0 (iPhone)", "Mozilla/5.0 (Android)", "Mozilla/5.0 (Windows)"]),
            createdAt: day,
          },
        });
      }
    }

    // referred users
    const nUsers = between(18, 40);
    for (let u = 0; u < nUsers; u++) {
      const uname = `${pick(usernames1)}${pick(usernames2)}${between(10, 99)}`;
      const joinedAt = new Date(now);
      joinedAt.setDate(now.getDate() - between(0, DAYS - 1));
      joinedAt.setHours(between(0, 23), between(0, 59));

      const ref = await db.referredUser.create({
        data: {
          username: uname,
          email: `${uname}@ensnake.com`,
          affiliateId: aff.id,
          referralCode: aff.referralCode,
          status: rand() > 0.15 ? "active" : "dormant",
          joinedAt,
        },
      });

      // deposits: 0-5 across the period after join
      let depositedTotal = 0;
      const depositCount = between(0, 5);
      for (let dp = 0; dp < depositCount; dp++) {
        const amt = pick([500, 1000, 2000, 5000, 10000, 25000, 50000]);
        const depAt = new Date(joinedAt.getTime() + between(1, 25) * 3600 * 1000);
        if (depAt > now) continue;
        await db.deposit.create({
          data: { referredUserId: ref.id, amount: amt, createdAt: depAt },
        });
        depositedTotal += amt;
      }

      // wagers: 0-30 across the period
      let wageredTotal = 0;
      let revenueTotal = 0;
      let commissionTotal = 0;
      const wagerCount = between(0, 30);
      for (let w = 0; w < wagerCount; w++) {
        const wagerAmt = pick([100, 200, 500, 1000, 2000, 3000, 5000, 10000]);
        const wAt = new Date(joinedAt.getTime() + between(1, 200) * 3600 * 1000);
        if (wAt > now) continue;
        const { platformRevenue, commission } = computeWagerEconomics(wagerAmt, aff.commissionPct);
        await db.wager.create({
          data: {
            referredUserId: ref.id,
            amount: wagerAmt,
            platformRevenue,
            commission,
            createdAt: wAt,
          },
        });
        wageredTotal += wagerAmt;
        revenueTotal += platformRevenue;
        commissionTotal += commission;
      }

      await db.referredUser.update({
        where: { id: ref.id },
        data: {
          deposited: depositedTotal,
          totalWagered: wageredTotal,
          revenueGenerated: revenueTotal,
          commissionGenerated: Math.round(commissionTotal * 100) / 100,
        },
      });

      // notifications for some users
      if (depositCount > 0) {
        await db.notification.create({
          data: {
            affiliateId: aff.id,
            type: "deposit",
            title: "New depositor",
            message: `${uname} just made their first deposit on ENSNAKE.`,
            read: rand() > 0.5,
            createdAt: joinedAt,
          },
        });
      }
      await db.notification.create({
        data: {
          affiliateId: aff.id,
          type: "signup",
          title: "New signup",
          message: `${uname} joined ENSNAKE using your referral code ${aff.referralCode}.`,
          read: rand() > 0.6,
          createdAt: joinedAt,
        },
      });
    }

    // withdrawals + payouts: keep totals consistent with commission earned.
    // earned = sum of commission. We allocate ~30% to historical paid payouts,
    // ~20% to a pending withdrawal, leaving ~50% as available balance.
    const earnedAgg = await db.wager.aggregate({
      where: { referredUser: { affiliateId: aff.id } },
      _sum: { commission: true },
    });
    const earned = Math.round((earnedAgg._sum.commission || 0) * 100) / 100;

    if (earned > 1000) {
      // Historical approved payouts (~30% of earned, split into 1-2)
      const paidTarget = Math.round(earned * 0.3);
      const paidCount = paidTarget > 8000 ? between(1, 2) : 1;
      let paidSoFar = 0;
      for (let h = 0; h < paidCount; h++) {
        const remaining = paidTarget - paidSoFar;
        if (remaining < 2000) break;
        const amt = h === paidCount - 1 ? remaining : Math.min(remaining, between(3000, Math.max(4000, Math.floor(remaining / 2))));
        if (amt <= 0) break;
        const wAt = new Date(now.getTime() - between(5, 25) * 24 * 3600 * 1000);
        const txn = `ESK${(Date.now() % 100000000).toString().padStart(8, "0")}${h}`;
        await db.withdrawal.create({
          data: {
            affiliateId: aff.id,
            amount: amt,
            bankName: pick(banks),
            accountNumber: `${between(1000000000, 9999999999)}`,
            accountName: aff.fullName,
            status: "approved",
            transactionId: txn,
            createdAt: wAt,
            processedAt: new Date(wAt.getTime() + 3600 * 1000),
          },
        });
        await db.payout.create({
          data: {
            affiliateId: aff.id,
            amount: amt,
            status: "completed",
            transactionId: txn,
            method: "bank_transfer",
            createdAt: new Date(wAt.getTime() + 3600 * 1000),
          },
        });
        await db.notification.create({
          data: {
            affiliateId: aff.id,
            type: "withdrawal_approved",
            title: "Withdrawal approved",
            message: `Your withdrawal of ₦${amt.toLocaleString()} was approved and paid out.`,
            read: rand() > 0.4,
            createdAt: new Date(wAt.getTime() + 3600 * 1000),
          },
        });
        paidSoFar += amt;
      }

      // One pending withdrawal (~20% of earned) so available balance stays positive
      const pendingAmt = Math.round(earned * 0.2);
      if (pendingAmt > 1000) {
        await db.withdrawal.create({
          data: {
            affiliateId: aff.id,
            amount: pendingAmt,
            bankName: pick(banks),
            accountNumber: `${between(1000000000, 9999999999)}`,
            accountName: aff.fullName,
            status: "pending",
            createdAt: new Date(now.getTime() - between(1, 48) * 3600 * 1000),
          },
        });
      }
    }
  }

  // A pending withdrawal notification for Joshua specifically
  await db.notification.create({
    data: {
      affiliateId: affiliates[0].id,
      type: "withdrawal_requested",
      title: "Withdrawal requested",
      message: "Your withdrawal request is pending admin approval.",
      read: false,
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
    },
  });

  console.log("Seed complete.");
  console.log("Admin login:    admin@ensnake.com / Admin@123");
  console.log("Affiliate demo: joshua@ensnake.com / Joshua@123");
  console.log("Affiliate demo: amara@ensnake.com / Amara@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
