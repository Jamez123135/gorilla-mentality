import { test, expect } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test.describe("free member tracking", () => {
  test.use({ actionTimeout: 15000 });
  test.skip(
    !process.env.DATABASE_URL?.includes("127.0.0.1:54329") ||
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
    "Member tests use only the local development database and Clerk instance.",
  );
  const backend = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const database = new PrismaClient();
  let userId: string;
  let email: string;
  test.beforeAll(async ({}, testInfo) => {
    email = `gorilla-${testInfo.project.name}-${Date.now()}+clerk_test@example.com`;
    const user = await backend.users.createUser({
      emailAddress: [email],
      firstName: "TestMember",
      skipPasswordRequirement: true,
    });
    userId = user.id;
  });
  test.afterAll(async () => {
    if (userId) {
      await database.profile.deleteMany({ where: { id: userId } });
      await backend.users.deleteUser(userId);
    }
    await database.$disconnect();
  });

  test("signs in, saves meals, workouts, and progress, then signs out", async ({
    page,
  }, testInfo) => {
    // This flow spans intake, meals, workouts, history, photos and sign-out.
    test.setTimeout(120000);
    await page.goto("/login");
    await expect(
      page.getByText("Member sign-in is temporarily unavailable."),
    ).toHaveCount(0);
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard/nutrition");
    await expect(
      page.getByRole("heading", { name: "Food Diary" }),
    ).toBeVisible();
    await page.getByLabel("Food or meal").fill("Chicken and rice");
    await page.getByLabel("Portion", { exact: true }).fill("1 bowl");
    await page.getByLabel("Calories", { exact: true }).fill("600");
    await page.getByLabel("Protein (g)", { exact: true }).fill("45");
    await page.getByLabel("Carbs (g)", { exact: true }).fill("65");
    await page.getByLabel("Fat (g)", { exact: true }).fill("15");
    await page.getByRole("button", { name: "Add meal", exact: true }).click();
    await expect(page.getByText("Meal saved.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Chicken and rice", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit Chicken and rice" }).click();
    await page.getByLabel("Calories", { exact: true }).fill("650");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/650 kcal/)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("food-diary.png"),
      fullPage: true,
    });

    await page.goto("/starter-pack");
    await page.getByRole("button", { name: /Lose fat/ }).click();
    await page.getByRole("button", { name: "Male", exact: true }).click();
    await page.getByRole("button", { name: /5 days/ }).click();
    await page.getByRole("button", { name: /Returning/ }).click();
    await page.getByLabel("Name", { exact: true }).fill("TestMember");
    await page.getByLabel("Age", { exact: true }).fill("28");
    await page.getByLabel("Height", { exact: true }).fill("178 cm");
    await page.getByLabel("Weight", { exact: true }).fill("82 kg");
    await page.getByRole("button", { name: "Generate my routine" }).click();
    await expect(
      page.getByRole("heading", { name: /TestMember's/ }),
    ).toBeVisible();
    await page.goto("/dashboard/workouts");
    const weightInputs = page.getByRole("spinbutton", { name: /weight/ });
    await weightInputs.first().fill("100");
    await page.getByRole("spinbutton", { name: /reps/ }).first().fill("8");
    await page.getByRole("button", { name: "Save Session" }).click();
    await expect(
      page.getByText("Session saved.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save Session" }).click();
    await expect(
      page.getByText("Session saved.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Saved session resumed.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: /weight/ }).first(),
    ).toHaveValue("100");
    await page
      .getByRole("button", { name: /set 1 complete/ })
      .first()
      .click();
    await page.getByLabel("Session effort").selectOption("challenging");
    await page
      .getByRole("button", { name: "Finish Session", exact: true })
      .click();
    await expect(
      page.getByText("Session finished. Your next workout is ready.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Next Workout", exact: true })
      .click();
    await expect(
      page.getByText("Day 2 of 5 / next session", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Workout history", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Workout History", exact: true })).toBeVisible();
    await expect(page.locator("main summary")).toContainText("1 set");
    await page.locator("main summary").click();
    await expect(
      page.getByRole("cell", { name: "100", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("workout-history.png"),
      fullPage: true,
    });

    await page.goto("/dashboard/progress");
    await page.getByLabel("Body weight", { exact: true }).fill("82");
    await page.getByLabel("Weight unit").selectOption("kg");
    await page.getByRole("button", { name: "Save weight" }).click();
    await expect(
      page.getByText("Weight saved.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByLabel("Weight unit").selectOption("kg");
    await expect(
      page.getByRole("cell", { name: "82 kg", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Add progress photo")
      .setInputFiles("public/brand.png");
    await expect(page.getByText("Photo saved.", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Progress Update" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("img", { name: "Progress Update" }),
    ).toBeVisible();
    expect(
      await page
        .getByRole("img", { name: "Progress Update" })
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0);
    await page.goto("/dashboard");
    await expect(page.getByText("650 kcal", { exact: true })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("dashboard.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (testInfo.project.name !== "desktop") await page.getByText("More member tools", { exact: true }).click();
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test("creates a free account through the sign-up form", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop" ||
      !process.env.DATABASE_URL?.includes("127.0.0.1:54329"),
    "Signup test uses local development services.",
  );
  const backend = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const database = new PrismaClient();
  const email = `signup-${Date.now()}+clerk_test@example.com`;
  try {
    await setupClerkTestingToken({ page });
    await page.goto("/signup");
    await expect(
      page.getByText("Development mode", { exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(`GorillaTest-${randomUUID()}!`);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Verify your email" }),
    ).toBeVisible({ timeout: 20000 });
    await page
      .getByLabel("Enter verification code", { exact: true })
      .fill("424242");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(
      page.getByText("Free Membership", { exact: true }),
    ).toBeVisible();
  } finally {
    const users = await backend.users.getUserList({ emailAddress: [email] });
    for (const user of users.data) {
      await database.profile.deleteMany({ where: { id: user.id } });
      await backend.users.deleteUser(user.id);
    }
    await database.$disconnect();
  }
});
