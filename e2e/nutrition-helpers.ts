import { expect, type Page } from "@playwright/test";

export async function reviewAndAddMeal(page: Page, returnToCalculator = true) {
  await page.getByRole("button", { name: "Save to Add meal", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Add meal", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Add meal", exact: true }).click();
  await expect(page.getByText("Meal saved.", { exact: true })).toBeVisible();
  if (returnToCalculator) await page.getByRole("tab", { name: "Meal calculator", exact: true }).click();
}
