import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@devassess.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const DEMO_COMPANY_EMAIL = "hr@techcorp-demo.com";
const DEMO_COMPANY_PASSWORD = "Company123!";
const DEMO_CANDIDATE_EMAIL = "candidate@demo.com";
const DEMO_CANDIDATE_PASSWORD = "Candidate123!";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Platform Admin",
      email: ADMIN_EMAIL,
      password: await hash(ADMIN_PASSWORD),
      role: "ADMIN",
    },
  });
  console.log(`  ✔ Admin ready: ${admin.email}`);

  // ── Demo company ────────────────────────────────────────────────────
  const companyUser = await prisma.user.upsert({
    where: { email: DEMO_COMPANY_EMAIL },
    update: {},
    create: {
      name: "TechCorp Recruiting",
      email: DEMO_COMPANY_EMAIL,
      password: await hash(DEMO_COMPANY_PASSWORD),
      role: "COMPANY",
    },
  });

  const companyProfile = await prisma.companyProfile.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      userId: companyUser.id,
      companyName: "TechCorp",
      website: "https://techcorp.example.com",
      industry: "Software",
      about: "A demo company account for evaluating the Developer Assessment Platform.",
      verified: true,
      assessmentCredits: 5,
    },
  });
  console.log(`  ✔ Demo company ready: ${companyUser.email}`);

  // ── Demo candidate ───────────────────────────────────────────────────
  const candidateUser = await prisma.user.upsert({
    where: { email: DEMO_CANDIDATE_EMAIL },
    update: {},
    create: {
      name: "Jamie Candidate",
      email: DEMO_CANDIDATE_EMAIL,
      password: await hash(DEMO_CANDIDATE_PASSWORD),
      role: "CANDIDATE",
    },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: candidateUser.id },
    update: {},
    create: {
      userId: candidateUser.id,
      headline: "Full-stack developer",
      bio: "Demo candidate account for evaluator testing.",
      skills: ["JavaScript", "TypeScript", "Node.js", "React"],
      experienceYears: 3,
      githubUrl: "https://github.com/example",
    },
  });
  console.log(`  ✔ Demo candidate ready: ${candidateUser.email}`);

  // ── Sample problems ──────────────────────────────────────────────────
  const mcqProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyId: companyProfile.id,
      createdById: companyUser.id,
      title: "Event loop basics",
      description: "Which statement correctly describes the Node.js event loop?",
      type: "MCQ",
      difficulty: "EASY",
      points: 10,
      tags: ["javascript", "node"],
      options: [
        { id: "a", text: "It runs JavaScript on multiple OS threads simultaneously" },
        { id: "b", text: "It allows non-blocking I/O on a single thread via callbacks/microtasks" },
        { id: "c", text: "It is exclusive to browser JavaScript" },
        { id: "d", text: "It replaces the need for asynchronous code" },
      ],
      correctOption: "b",
    },
  });

  const codingProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      companyId: companyProfile.id,
      createdById: companyUser.id,
      title: "Two Sum",
      description: "Given an array of integers and a target, return indices of the two numbers that add up to target.",
      type: "CODING",
      difficulty: "MEDIUM",
      points: 20,
      tags: ["arrays", "algorithms"],
      starterCode: "function twoSum(nums, target) {\n  // your code here\n}",
      language: "javascript",
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]" },
      ],
    },
  });

  const writtenProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      companyId: companyProfile.id,
      createdById: companyUser.id,
      title: "Explain REST vs GraphQL",
      description: "In your own words, explain the key trade-offs between REST and GraphQL API design.",
      type: "WRITTEN",
      difficulty: "MEDIUM",
      points: 15,
      tags: ["api-design"],
    },
  });
  console.log("  ✔ Sample problems ready");

  // ── Sample assessment (published, with credit consumed) ─────────────
  const assessment = await prisma.assessment.upsert({
    where: { id: "00000000-0000-0000-0000-0000000000a1" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-0000000000a1",
      companyId: companyProfile.id,
      createdById: companyUser.id,
      title: "Backend Engineer — Screening Assessment",
      description: "A short screening assessment covering JS fundamentals, algorithms, and API design judgement.",
      durationMinutes: 45,
      passingScore: 60,
      status: "PUBLISHED",
    },
  });

  for (const [problem, order] of [
    [mcqProblem, 0],
    [codingProblem, 1],
    [writtenProblem, 2],
  ] as const) {
    await prisma.assessmentProblem.upsert({
      where: { assessmentId_problemId: { assessmentId: assessment.id, problemId: problem.id } },
      update: {},
      create: { assessmentId: assessment.id, problemId: problem.id, order },
    });
  }
  console.log("  ✔ Sample assessment published with 3 problems");

  // ── Sample invitation for the demo candidate ─────────────────────────
  await prisma.invitation.upsert({
    where: { assessmentId_candidateId: { assessmentId: assessment.id, candidateId: candidateUser.id } },
    update: {},
    create: {
      assessmentId: assessment.id,
      candidateId: candidateUser.id,
      invitedById: companyUser.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("  ✔ Demo candidate invited to the sample assessment");

  console.log("\n🎉 Seed complete. Demo credentials:");
  console.log(`   Admin:     ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Company:   ${DEMO_COMPANY_EMAIL} / ${DEMO_COMPANY_PASSWORD}`);
  console.log(`   Candidate: ${DEMO_CANDIDATE_EMAIL} / ${DEMO_CANDIDATE_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
