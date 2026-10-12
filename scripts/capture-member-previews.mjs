import dotenv from "dotenv";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { clerkSetup, clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL?.includes("127.0.0.1:54329"))
  throw new Error("Preview capture requires the local development database.");
process.env.CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
await clerkSetup();
const backend = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const database = new PrismaClient();
const email = `member-preview-${Date.now()}+clerk_test@example.com`;
const user = await backend.users.createUser({
  emailAddress: [email],
  firstName: "Gorilla",
  lastName: "Member",
  skipPasswordRequirement: true,
});
const browser = await chromium.launch();
mkdirSync("public/member-tools", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 820 },
  });
  await page.goto("http://localhost:3000/login");
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("http://localhost:3000/starter-pack");
  for (const [label, value] of [
    ["Name", "Gorilla Member"],
    ["Age", "28"],
    ["Height", "178 cm"],
    ["Weight", "82 kg"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: /Build muscle/ }).click();
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: /4 days/ }).click();
  await page.getByRole("button", { name: /Consistent/ }).click();
  await page.getByRole("button", { name: "Generate my routine" }).click();
  await page.getByRole("heading", { name: /Gorilla's/ }).waitFor();
  await page.goto("http://localhost:3000/dashboard/workouts");
  await page
    .getByRole("spinbutton", { name: /weight/ })
    .first()
    .fill("135");
  await page.getByRole("spinbutton", { name: /reps/ }).first().fill("10");
  await page.screenshot({ path: "public/member-tools/workouts.png" });
  await page.goto("http://localhost:3000/dashboard/nutrition");
  for (const [name, calories, protein, carbs, fat] of [
    ["Chicken, rice and vegetables", 650, 45, 65, 15],
    ["Greek yogurt and berries", 220, 22, 24, 4],
  ]) {
    await page.getByLabel("Food or meal").fill(name);
    await page.getByLabel("Calories", { exact: true }).fill(String(calories));
    await page.getByLabel("Protein (g)", { exact: true }).fill(String(protein));
    await page.getByLabel("Carbs (g)", { exact: true }).fill(String(carbs));
    await page.getByLabel("Fat (g)", { exact: true }).fill(String(fat));
    await page.getByRole("button", { name: "Add meal", exact: true }).click();
    await page.getByText("Meal saved.", { exact: true }).waitFor();
  }
  await page.reload();
  await page
    .getByText("Chicken, rice and vegetables", { exact: true })
    .waitFor();
  await page.screenshot({ path: "public/member-tools/meals.png" });
  await page.goto("http://localhost:3000/dashboard/progress");
  await page.getByLabel("Body weight").fill("180.8");
  await page.getByRole("button", { name: "Save weight" }).click();
  await page.getByText("Weight saved.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("cell", { name: "180.8 lb", exact: true }).waitFor();
  await page.screenshot({ path: "public/member-tools/progress.png" });
  console.log("Captured branded member-tool previews.");
} finally {
  await browser.close();
  await database.profile.deleteMany({ where: { id: user.id } });
  await backend.users.deleteUser(user.id);
  await database.$disconnect();
}
