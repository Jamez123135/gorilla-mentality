import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

test.describe("international nutrition library", () => {
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
    email = `foods-${info.project.name}-${Date.now()}+clerk_test@example.com`;
    userId = (
      await backend.users.createUser({
        emailAddress: [email],
        firstName: "PantryMember",
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
  test("searches, measures, saves personal labels and pantries, and preserves history", async ({
    page,
  }, info) => {
    test.setTimeout(150000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard/nutrition");
    await expect(
      page.getByText("8,104 source-backed foods + your personal labels"),
    ).toBeVisible();
    await page
      .getByLabel("Search food ingredients", { exact: true })
      .fill("quinoa");
    await page
      .getByLabel("Food ingredient", { exact: true })
      .selectOption("fdc-168917");
    await page
      .getByRole("button", { name: "Add ingredient", exact: true })
      .click();
    await page.getByLabel("Ingredient 1 measure").selectOption("28.349523125");
    await expect(page.getByLabel("Ingredient 1 grams")).toHaveValue(
      "28.349523125",
    );
    await expect(page.getByText(/Estimated: 34 kcal/)).toBeVisible();
    await page.getByLabel("Ingredient 1 grams").fill("0");
    await expect(
      page.getByText("Enter a weight above 0 and up to 2,000g."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save calculated meal" }),
    ).toBeDisabled();
    await page.getByLabel("Ingredient 1 grams").fill("100");
    await page.getByLabel("Calculated meal name").fill("Measured quinoa");
    await page.getByRole("button", { name: "Save calculated meal" }).click();
    await expect(
      page.getByText("Calculated meal saved.", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Search food ingredients", { exact: true })
      .fill("totallyunknownfoodxyz");
    await expect(
      page.getByText(
        "No verified match. A personal label entry can cover this food.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add ingredient", exact: true }),
    ).toBeDisabled();

    await page
      .getByRole("button", { name: "Add label food", exact: true })
      .click();
    const labelName = `Pantry garri label ${info.project.name}`;
    await page.getByLabel("Label food name", { exact: true }).fill(labelName);
    await page.getByLabel("Brand (optional)").fill("Example");
    await page.getByLabel("Label serving weight (g)").fill("50");
    await page
      .getByLabel("Label calories per serving", { exact: true })
      .fill("180");
    await page.getByLabel("Label protein per serving (g)").fill("1");
    await page.getByLabel("Label carbs per serving (g)").fill("43");
    await page.getByLabel("Label fat per serving (g)").fill("0.5");
    await page
      .getByLabel("Preparation state", { exact: true })
      .selectOption("dry");
    await page.getByLabel("Meal ingredient role").selectOption("starch");
    await page.getByLabel("Label dietary classification").selectOption("vegan");
    await page
      .getByLabel("Label reference", { exact: true })
      .fill(
        "Example nutrition label for browser verification " + "x".repeat(170),
      );
    await page
      .getByLabel("I reviewed the label's allergen declarations.")
      .check();
    await page
      .getByRole("button", { name: "Save label food", exact: true })
      .click();
    await expect(
      page.getByText("Personal label food saved.", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.getByLabel("Ingredient 1 grams").fill("50");
    await page.getByLabel("Calculated meal name").fill("My labelled meal");
    await page.getByRole("button", { name: "Save calculated meal" }).click();
    await expect(
      page.getByText("Calculated meal saved.", { exact: true }),
    ).toBeVisible();
    const custom = await database.customFood.findFirstOrThrow({
      where: { userId, name: labelName },
    });
    expect(custom.calories).toBe(360);
    const meal = await database.mealEntry.findFirstOrThrow({
      where: { userId, name: "My labelled meal" },
    });
    expect(meal).toMatchObject({
      calories: 180,
      protein: 1,
      carbs: 43,
      fat: 0.5,
    });
    expect(JSON.stringify(meal.ingredients)).toContain(
      "Example nutrition label",
    );

    await page.getByRole("tab", { name: "Pantry ideas" }).click();
    await page
      .getByLabel("Available ingredients", { exact: true })
      .fill("beans, totallyunknownfoodxyz");
    await expect(
      page.getByText(/No verified match: totallyunknownfoodxyz/),
    ).toBeVisible();
    await expect(
      page.getByLabel("Confirm food and preparation for: beans"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save pantry", exact: true })
      .click();
    await expect(
      page.getByText(
        "Confirm or remove unresolved ingredients before saving your pantry.",
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Available ingredients", { exact: true }),
    ).toHaveValue("beans, totallyunknownfoodxyz");
    await page
      .getByLabel("Available ingredients", { exact: true })
      .fill("chicken, rice, broccoli, lentils");
    await page.getByLabel("Diet preference").selectOption("vegan");
    await page.getByLabel("Meals remaining today").fill("2");
    await page.getByRole("checkbox", { name: "milk", exact: true }).check();
    await page.getByLabel("Meal protein target (g)").fill("20");
    await page.getByLabel("Meal calorie budget").fill("500");
    await expect(page.locator("article")).not.toHaveCount(0);
    await expect(
      page.locator("article").filter({ hasText: "Chicken" }),
    ).toHaveCount(0);
    await expect(page.locator("article").first()).toContainText(
      "All ingredients available",
    );
    await page
      .getByRole("button", { name: "Save pantry", exact: true })
      .click();
    await expect(
      page.getByText("Pantry and preferences saved.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Pantry ideas" }).click();
    await expect(page.getByLabel("Diet preference")).toHaveValue("vegan");
    await expect(page.getByLabel("Meals remaining today")).toHaveValue("2");
    await expect(page.getByLabel("Meal calorie budget")).toHaveValue("500");
    await expect(page.getByLabel("Meal protein target (g)")).toHaveValue("20");
    await expect(
      page.getByRole("checkbox", { name: "milk", exact: true }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Only use my available ingredients"),
    ).toBeChecked();
    const storedPantry = await database.memberPantry.findUniqueOrThrow({
      where: { userId },
    });
    expect(storedPantry.foodIds.sort()).toEqual(
      ["chicken", "rice", "broccoli", "lentils"].sort(),
    );
    await expect(page.locator("article")).not.toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: info.outputPath("international-pantry.png"),
      fullPage: true,
    });
    await page
      .getByRole("heading", { name: "Pantry ideas", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("pantry-controls.png") });
    await page.getByLabel("Diet preference").scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("pantry-preferences.png") });

    await page.getByText("My label foods (1)", { exact: true }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", {
        name: `Delete label food ${labelName} (Example)`,
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Label food deleted. Meal history retained."),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("My labelled meal", { exact: true }),
    ).toBeVisible();
    const historical = await database.mealEntry.findUniqueOrThrow({
      where: { id: meal.id },
    });
    expect(historical.calories).toBe(180);
    expect(JSON.stringify(historical.ingredients)).toContain(labelName);
    expect(await database.customFood.count({ where: { userId } })).toBe(0);
    await page
      .getByRole("button", { name: "Edit My labelled meal", exact: true })
      .click();
    await expect(
      page.getByText(
        "Manual changes replace the calculated ingredient breakdown.",
      ),
    ).toBeVisible();
    await page
      .getByRole("spinbutton", { name: "Calories", exact: true })
      .fill("190");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByText("Meal saved.", { exact: true })).toBeVisible();
    expect(
      (await database.mealEntry.findUniqueOrThrow({ where: { id: meal.id } }))
        .ingredients,
    ).toBeNull();
    expect(errors).toEqual([]);
  });
  test("keeps the selected diary day during a delayed calculated meal save", async ({
    page,
  }) => {
    await page.goto("/login");
    await clerk.signIn({ page, emailAddress: email });
    await page.goto("/dashboard/nutrition");
    await expect(
      page.getByText("8,104 source-backed foods + your personal labels"),
    ).toBeVisible();
    const originalDate = await page.getByLabel("Food diary date").inputValue();
    const nextDate = "2020-01-02";
    await page
      .getByLabel("Calculated meal name")
      .fill("Delayed date-check meal");
    await page
      .getByLabel("Food ingredient", { exact: true })
      .selectOption("chicken");
    await page
      .getByRole("button", { name: "Add ingredient", exact: true })
      .click();
    let delayed = false;
    await page.route("**/dashboard/nutrition", async (route) => {
      if (route.request().method() === "POST" && !delayed) {
        delayed = true;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      await route.continue();
    });
    const refreshedOldDate = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        (response.request().postData() ?? "").includes(originalDate) &&
        !(response.request().postData() ?? "").includes("portions"),
    );
    await page.getByRole("button", { name: "Save calculated meal" }).click();
    await page.getByLabel("Food diary date").fill(nextDate);
    await refreshedOldDate;
    await expect(page.getByLabel("Food diary date")).toHaveValue(nextDate);
    await expect(page.getByText("No meals logged for this day.")).toBeVisible();
    await expect(
      page.getByText("Delayed date-check meal", { exact: true }),
    ).toHaveCount(0);
    expect(
      (
        await database.mealEntry.findFirstOrThrow({
          where: { userId, name: "Delayed date-check meal" },
        })
      ).logDate
        .toISOString()
        .slice(0, 10),
    ).toBe(originalDate);
  });
});
