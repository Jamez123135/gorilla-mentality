import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { reviewAndAddMeal } from "./nutrition-helpers";

test.describe("transformation tools", () => {
  test.skip(
    !process.env.DATABASE_URL?.includes("127.0.0.1:54329") ||
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
    "Local database and development authentication only",
  );
  const backend = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const database = new PrismaClient();
  let userId: string;
  let email: string;
  let otherId: string;
  let otherPostId: string;
  test.beforeAll(async ({}, info) => {
    email = `tools-${info.project.name}-${Date.now()}+clerk_test@example.com`;
    const user = await backend.users.createUser({
      emailAddress: [email],
      firstName: "ToolsMember",
      skipPasswordRequirement: true,
    });
    userId = user.id;
    otherId = `local-test-${randomUUID()}`;
    await database.profile.create({ data: { id: otherId } });
    const post = await database.communityPost.create({
      data: {
        userId: otherId,
        authorName: `Other-${info.project.name}`,
        category: "question",
        body: `Question-${info.project.name}`,
      },
    });
    otherPostId = post.id;
  });
  test.afterAll(async () => {
    await database.profile.deleteMany({
      where: { id: { in: [userId, otherId].filter(Boolean) } },
    });
    if (userId) await backend.users.deleteUser(userId);
    await database.$disconnect();
  });
  test("stays signed in through session token refresh", async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "desktop",
      "One real-time token refresh check is sufficient.",
    );
    test.setTimeout(100000);
    await database.profile.upsert({
      where: { id: userId },
      create: { id: userId, fullName: "RefreshMember" },
      update: {},
    });
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    // Clerk tokens last about 60 seconds; use real time to exercise renewal.
    await page.waitForTimeout(65000);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    const response = await page.request.get("/api/profile");
    expect(response.status()).toBe(200);
    expect((await response.json()).id).toBe(userId);
  });
  test("saves a focus plan, edits preferences, calculates meals, and participates in community", async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/starter-pack");
    await page.getByRole("button", { name: /Build muscle/ }).click();
    await page.getByRole("button", { name: "Male", exact: true }).click();
    await page.getByRole("button", { name: /3 days/ }).click();
    await page.getByRole("button", { name: /Returning/ }).click();
    await page.getByLabel("Muscle priority (optional)").selectOption("glutes");
    await page.getByLabel("Name", { exact: true }).fill("ToolsMember");
    await page.getByLabel("Age", { exact: true }).fill("28");
    await page.getByLabel("Height", { exact: true }).fill("178 cm");
    await page.getByLabel("Weight", { exact: true }).fill("180 lb");
    await page.getByRole("button", { name: "Generate my routine" }).click();
    await page.getByRole("link", { name: "View in Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/workouts$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Glutes priority/ }),
    ).toBeVisible();
    await page
      .getByRole("spinbutton", { name: /weight/ })
      .first()
      .fill("100");
    await page.getByRole("spinbutton", { name: /reps/ }).first().fill("8");
    await page
      .getByRole("button", { name: /set 1 complete/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Finish Session", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Session feedback" }),
    ).toBeVisible();
    await expect(page.getByText(/Partial session recorded/)).toBeVisible();
    await page.goto("/dashboard/profile");
    await page
      .getByLabel("Muscle priority", { exact: true })
      .selectOption("back");
    await page
      .getByRole("button", { name: "Save training preferences" })
      .click();
    await page.getByRole("link", { name: "View routine", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Back priority/ }),
    ).toBeVisible();
    expect(await database.workoutLog.count({ where: { userId } })).toBe(1);

    await page.goto("/dashboard/nutrition");
    await page.getByRole("tab", { name: "Meal calculator", exact: true }).click();
    await page.getByLabel("Calculated meal name").fill("Weighed chicken");
    await page.getByTestId("pick-meal-chicken").click();
    await expect(page.getByText(/Estimated: 165 kcal/)).toBeVisible();
    await reviewAndAddMeal(page);
    await expect(
      page.getByText("Meal saved.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Weighed chicken", { exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Pantry ideas" }).click();
    await page
      .getByLabel("Available ingredients", { exact: true })
      .fill("chicken, rice, broccoli");
    await page.getByLabel("Meal calorie budget").fill("500");
    await page.getByLabel("Meal protein target (g)").fill("35");
    await expect(
      page.getByRole("heading", { name: "Chicken, rice and broccoli bowl" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Use meal idea" }).first().click();
    await expect(page.getByLabel("Food or meal")).toHaveValue(
      "Chicken, rice and broccoli bowl",
    );
    await expect(
      page.getByRole("tabpanel", { name: "Add meal" }).locator("li"),
    ).toHaveCount(3);
    await page.screenshot({
      path: info.outputPath("calculator.png"),
      fullPage: true,
    });

    await page.goto("/dashboard/community");
    await expect(
      page
        .getByRole("navigation", { name: "Dashboard" })
        .getByRole("link", { name: "Resources", exact: true }),
    ).toHaveCount(0);
    const display = `Member-${info.project.name}`;
    const body = `Progress-${info.project.name}`;
    await page.getByLabel("Public display name").fill(display);
    await page.getByLabel("Share with the community").fill(body);
    await page.getByRole("button", { name: "Share post", exact: true }).click();
    const own = page
      .locator("article")
      .filter({ has: page.getByText(body, { exact: true }) });
    await expect(own).toBeVisible();
    await own.getByRole("button", { name: "Like post", exact: true }).click();
    await expect(
      own.getByRole("button", { name: "Unlike post" }),
    ).toHaveAttribute("aria-pressed", "true");
    await own.getByRole("button", { name: "View comments" }).click();
    await own
      .getByLabel("Comment", { exact: true })
      .fill("Consistency is improving.");
    await own.getByRole("button", { name: "Post comment" }).click();
    await expect(
      own.getByText("Consistency is improving.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(own).toBeVisible();
    await own.getByRole("button", { name: "Edit post" }).click();
    await page
      .getByRole("textbox", { name: "Edit post", exact: true })
      .fill(body + " updated");
    await page.getByRole("button", { name: "Save post", exact: true }).click();
    const edited = page
      .locator("article")
      .filter({ has: page.getByText(body + " updated", { exact: true }) });
    await expect(edited).toBeVisible();
    const other = page.locator("article").filter({
      has: page.getByText(`Question-${info.project.name}`, { exact: true }),
    });
    await expect(
      other.getByRole("button", { name: "Delete post" }),
    ).toHaveCount(0);
    await other.getByRole("button", { name: "Report post" }).click();
    await other
      .getByLabel("Reason for report")
      .fill("Test report for moderation.");
    await other.getByRole("button", { name: "Send report" }).click();
    await expect(
      page.getByText("Report sent for moderator review."),
    ).toBeVisible();
    expect(
      await database.communityReport.count({
        where: { userId, postId: otherPostId },
      }),
    ).toBe(1);
    await expect(page.locator("body")).not.toContainText(email);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: info.outputPath("community.png"),
      fullPage: true,
    });
    page.once("dialog", (dialog) => dialog.accept());
    await edited.getByRole("button", { name: "Delete post" }).click();
    await expect(edited).toHaveCount(0);
    expect(await database.communityComment.count({ where: { userId } })).toBe(
      0,
    );
  });
});
