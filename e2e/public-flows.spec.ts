import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.beforeEach(async ({ page }) => {
  if (process.env.CLERK_TESTING_TOKEN) await setupClerkTestingToken({ page });
});

test("public routes render and fit the viewport", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of [
    "/",
    "/starter-pack",
    "/coaching",
    "/feedback",
    "/login",
    "/signup",
  ]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/coaching$/);
  await page.screenshot({
    path: testInfo.outputPath("coaching.png"),
    fullPage: false,
  });
  expect(errors).toEqual([]);
});

test("starter plan generates, adjusts, and downloads a PDF", async ({
  page,
}, testInfo) => {
  await page.goto("/starter-pack");
  await page.getByLabel("Name", { exact: true }).fill("Alex");
  await page.getByLabel("Age", { exact: true }).fill("28");
  await page.getByLabel("Height", { exact: true }).fill("178 cm");
  await page.getByLabel("Weight", { exact: true }).fill("82 kg");
  await page.getByRole("button", { name: "Female", exact: true }).click();
  await page.getByRole("button", { name: /4 days/ }).click();
  await page.getByRole("button", { name: "Generate my routine" }).click();
  await expect(
    page.getByRole("heading", { name: "Alex's 4-day fat-loss starter plan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Training routine" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("generated-plan.png"),
    fullPage: true,
  });
  if (testInfo.project.name === "desktop") {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save PDF" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("alex-starter-plan.pdf");
    await file.saveAs(testInfo.outputPath("alex-starter-plan.pdf"));
    expect(await file.failure()).toBeNull();
  }
  await page.getByRole("button", { name: "Adjust intake" }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Alex");
});

test("member data stays protected without a session", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  const response = await page.request.get("/api/profile");
  expect([401, 404, 503]).toContain(response.status());
});
