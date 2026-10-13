import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
test.describe("free on-device nutrition-label scanning", () => {
  test.use({ actionTimeout: 15000 });
  test.skip(
    !process.env.DATABASE_URL?.includes("127.0.0.1:54329") ||
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
    "Disposable local database and development auth only",
  );
  const backend = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const database = new PrismaClient();
  let userId: string;
  let email: string;
  test.beforeAll(async ({}, info) => {
    email = `scan-${info.project.name}-${Date.now()}+clerk_test@example.com`;
    userId = (
      await backend.users.createUser({
        emailAddress: [email],
        firstName: "ScanMember",
        skipPasswordRequirement: true,
      })
    ).id;
    await database.profile.create({
      data: { id: userId, targetCalories: 2100, targetProtein: 150 },
    });
  });
  test.afterAll(async () => {
    if (userId) {
      await database.profile.deleteMany({ where: { id: userId } });
      await backend.users.deleteUser(userId);
    }
    await database.$disconnect();
  });
  test("reads an actual image locally, requires review, saves its reference serving, and logs correct macros", async ({
    page,
  }, info) => {
    test.setTimeout(150000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard/nutrition");
    await page
      .getByRole("button", { name: "Add label food", exact: true })
      .click();
    await page
      .getByLabel("Label food name", { exact: true })
      .fill("Scanned snack");
    const network: { url: string; body: string }[] = [];
    page.on("request", (request) =>
      network.push({ url: request.url(), body: request.postData() ?? "" }),
    );
    await page
      .getByLabel("Upload nutrition label photo", { exact: true })
      .setInputFiles("e2e/fixtures/nutrition-label.png");
    await expect(page.getByAltText("Selected nutrition label")).toBeVisible();
    await page.getByRole("button", { name: "Read label", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Use detected values", exact: true }),
    ).toBeEnabled({ timeout: 90000 });
    const recognized = await page
      .getByLabel("Nutrition label scanner", { exact: true })
      .locator("pre")
      .textContent();
    await info.attach("recognized-label.txt", {
      body: recognized ?? "",
      contentType: "text/plain",
    });
    expect(
      network
        .filter((request) => /ocr\//.test(request.url))
        .every((request) =>
          request.url.startsWith("http://localhost:3000/ocr/"),
        ),
    ).toBe(true);
    expect(
      network.some(
        (request) =>
          request.body.includes("data:image") ||
          request.body.includes("nutrition-label.png"),
      ),
    ).toBe(false);
    await page
      .getByRole("button", { name: "Use detected values", exact: true })
      .click();
    await expect(page.getByLabel("Label serving weight (g)")).toHaveValue("55");
    await expect(
      page.getByLabel("Label calories per serving", { exact: true }),
    ).toHaveValue("220");
    await expect(page.getByLabel("Label protein per serving (g)")).toHaveValue(
      "5",
    );
    await expect(page.getByLabel("Label carbs per serving (g)")).toHaveValue(
      "35",
    );
    await expect(page.getByLabel("Label fat per serving (g)")).toHaveValue("7");
    await expect(
      page.getByRole("button", { name: "Save label food", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("I reviewed the label's allergen declarations."),
    ).not.toBeChecked();
    await page
      .getByLabel(
        "I checked the reference weight and every detected macro against the photo.",
      )
      .check();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page
      .getByRole("button", { name: "Use detected values", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("scanned-review.png") });
    await page
      .getByRole("button", { name: "Save label food", exact: true })
      .click();
    await expect(
      page.getByText("Personal label food saved.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Ingredient 1 grams")).toHaveValue("55");
    await expect(page.getByLabel("Calculated meal name")).toHaveValue(
      "Scanned snack",
    );
    await expect(
      page.getByText(/Estimated: 220 kcal \/ P 5g \/ C 35g \/ F 7g/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save calculated meal", exact: true })
      .click();
    await expect(
      page.getByText("Calculated meal saved.", { exact: true }),
    ).toBeVisible();
    const saved = await database.customFood.findFirstOrThrow({
      where: { userId, name: "Scanned snack" },
    });
    expect(saved).toMatchObject({
      servingGrams: 55,
      referenceBasis: "serving",
      calories: 400,
    });
    expect(
      await database.mealEntry.findFirstOrThrow({
        where: { userId, name: "Scanned snack" },
      }),
    ).toMatchObject({ calories: 220, protein: 5, carbs: 35, fat: 7 });
    await page.reload();
    await expect(
      page.getByText("Scanned snack", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
  test("handles unreadable files, blank labels, cancellation and recovery without stale values", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard/nutrition");
    await page
      .getByRole("button", { name: "Add label food", exact: true })
      .click();
    await page
      .getByLabel("Label food name", { exact: true })
      .fill("Manual fallback");
    await page
      .getByLabel("Upload nutrition label photo", { exact: true })
      .setInputFiles({
        name: "bad.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("invalid"),
      });
    await expect(
      page.getByText(/HEIC, PDF and GIF files are not supported/),
    ).toBeVisible();
    await page
      .getByLabel("Upload nutrition label photo", { exact: true })
      .setInputFiles("e2e/fixtures/blank-label.png");
    await expect(page.getByAltText("Selected nutrition label")).toBeVisible();
    await page.getByRole("button", { name: "Read label", exact: true }).click();
    await expect(page.getByText(/Photo unclear/)).toBeVisible({
      timeout: 90000,
    });
    await expect(
      page.getByRole("button", { name: "Use detected values", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Label calories per serving", { exact: true }),
    ).toHaveValue("");
    await page
      .getByRole("button", { name: "Remove label photo", exact: true })
      .click();
    await page
      .getByLabel("Upload nutrition label photo", { exact: true })
      .setInputFiles("e2e/fixtures/nutrition-label.png");
    await expect(page.getByAltText("Selected nutrition label")).toBeVisible();
    await page
      .getByRole("button", { name: "Rotate label clockwise", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Read label", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Read label", exact: true }).click();
    await page
      .getByRole("button", { name: "Cancel scan", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Read label", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Use detected values", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Remove label photo", exact: true })
      .click();
    await page.getByLabel("Label serving weight (g)").fill("50");
    for (const [label, value] of [
      ["Label calories per serving", "180"],
      ["Label protein per serving (g)", "1"],
      ["Label carbs per serving (g)", "43"],
      ["Label fat per serving (g)", "0.5"],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await page
      .getByRole("button", { name: "Save label food", exact: true })
      .click();
    await expect(
      page.getByText("Personal label food saved.", { exact: true }),
    ).toBeVisible();
    expect(
      await database.customFood.count({
        where: { userId, name: "Manual fallback" },
      }),
    ).toBe(1);
  });
});
