import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: { upsert: vi.fn() },
  customFood: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  memberPantry: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
  mealEntry: { create: vi.fn(), updateMany: vi.fn() },
  transaction: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/prisma", () => ({
  prisma: { ...mocks, $transaction: mocks.transaction },
}));
import {
  getFoodToolsState,
  searchFoods,
  saveLabelFood,
  savePantry,
  deleteLabelFood,
  getPantrySuggestions,
} from "@/app/lib/actions/food-tools";
import { saveCalculatedMeal, saveMeal } from "@/app/lib/actions/meals";
import { resolveOwnedFoods } from "@/app/lib/owned-foods";
import { Prisma } from "@prisma/client";

const id = "8b8376ca-69c7-4e12-bd3e-36f0d0b4e756";
const row = {
  id,
  userId: "owner",
  createdAt: new Date(),
  name: "Garri test label",
  brand: "",
  reference: "Package test label",
  calories: 360,
  protein: 2,
  carbs: 86,
  fat: 1,
  preparation: "dry",
  role: "starch",
  diet: "vegan",
  allergens: [],
  labelReviewed: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "owner" });
  mocks.transaction.mockImplementation((callback) => callback(mocks));
  mocks.customFood.findMany.mockResolvedValue([]);
  mocks.customFood.count.mockResolvedValue(0);
  mocks.customFood.create.mockImplementation(({ data }) => ({
    ...row,
    ...data,
  }));
  mocks.memberPantry.findUnique.mockResolvedValue(null);
  mocks.customFood.deleteMany.mockResolvedValue({ count: 1 });
  mocks.mealEntry.updateMany.mockResolvedValue({ count: 1 });
});

describe("private nutrition tools", () => {
  it("requires a session for every nutrition-library operation", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    for (const call of [
      () => getFoodToolsState(),
      () => searchFoods("rice"),
      () => savePantry({}),
      () => saveLabelFood({}),
      () => deleteLabelFood(id),
      () => getPantrySuggestions({}),
    ])
      await expect(call()).rejects.toThrow("Unauthorized");
  });
  it("normalizes label servings to 100g and assigns the authenticated owner", async () => {
    await saveLabelFood({
      ...row,
      userId: "victim",
      servingGrams: 50,
      calories: 180,
      protein: 1,
      carbs: 43,
      fat: 0.5,
    });
    expect(mocks.customFood.create.mock.calls[0][0].data).toMatchObject({
      userId: "owner",
      calories: 360,
      protein: 2,
      carbs: 86,
      fat: 1,
      servingGrams: 50,
      referenceBasis: "serving",
    });
    mocks.customFood.count.mockResolvedValue(200);
    await expect(saveLabelFood({ ...row, servingGrams: 100 })).rejects.toThrow(
      /full/,
    );
  });
  it("retains per-100g label references and rejects mismatched reference weights", async () => {
    const food = await saveLabelFood({
      ...row,
      servingGrams: 100,
      referenceBasis: "100g",
    });
    expect(food.portions).toEqual([
      { label: "100g label reference", grams: 100 },
    ]);
    await expect(
      saveLabelFood({ ...row, servingGrams: 50, referenceBasis: "100g" }),
    ).rejects.toThrow(/Check/);
  });
  it("scopes custom-food reads and rejects unavailable or another member's IDs", async () => {
    await expect(resolveOwnedFoods("owner", [`custom:${id}`])).rejects.toThrow(
      /unavailable/,
    );
    expect(mocks.customFood.findMany).toHaveBeenCalledWith({
      where: { userId: "owner", id: { in: [id] } },
    });
    await expect(
      savePantry({ ids: [`custom:${id}`], preferences: {} }),
    ).rejects.toThrow();
    expect(mocks.memberPantry.upsert).not.toHaveBeenCalled();
    await searchFoods("garri", "Personal label foods");
    expect(mocks.customFood.findMany.mock.calls.at(-1)![0].where.userId).toBe(
      "owner",
    );
  });
  it("saves only valid foods and the authenticated member's preferences", async () => {
    await savePantry({
      userId: "victim",
      ids: ["rice", "rice"],
      preferences: {
        diet: "vegan",
        excluded: ["milk"],
        onlyAvailable: true,
        mealsRemaining: 2,
      },
    });
    const write = mocks.memberPantry.upsert.mock.calls[0][0];
    expect(write.where).toEqual({ userId: "owner" });
    expect(write.create.foodIds).toEqual(["rice"]);
    expect(write.create.preferences.diet).toBe("vegan");
  });
  it("keeps source and ingredient snapshots so deletion cannot alter past meals", async () => {
    mocks.customFood.findMany.mockResolvedValue([row]);
    await saveCalculatedMeal({
      date: "2026-10-13",
      name: "Weighed garri",
      mealType: "lunch",
      portions: [{ foodId: `custom:${id}`, grams: 50 }],
      calories: 1,
    });
    const write = mocks.mealEntry.create.mock.calls[0][0].data;
    expect(write).toMatchObject({
      calories: 180,
      protein: 1,
      carbs: 43,
      fat: 0.5,
      userId: "owner",
    });
    expect(write.ingredients[0].food.source).toBe(
      "Your label: Package test label",
    );
    expect(write.ingredients[0].food).not.toHaveProperty("userId");
    mocks.memberPantry.findUnique.mockResolvedValue({
      foodIds: ["rice", `custom:${id}`],
    });
    await deleteLabelFood(`custom:${id}`);
    expect(mocks.customFood.deleteMany).toHaveBeenCalledWith({
      where: { id, userId: "owner" },
    });
    expect(mocks.memberPantry.update.mock.calls[0][0].data.foodIds).toEqual([
      "rice",
    ]);
    expect(mocks.mealEntry.updateMany).not.toHaveBeenCalled();
  });
  it("clears the old ingredient snapshot when a member manually replaces macro totals", async () => {
    await saveMeal({
      id,
      date: "2026-10-13",
      name: "Edited meal",
      mealType: "lunch",
      portion: "1 bowl",
      calories: 200,
      protein: 10,
      carbs: 20,
      fat: 5,
    });
    expect(mocks.mealEntry.updateMany.mock.calls[0][0]).toMatchObject({
      where: { userId: "owner", id },
      data: { ingredients: Prisma.DbNull },
    });
  });
  it("rejects invalid suggestion budgets and keeps ambiguous foods unselected", async () => {
    await expect(
      getPantrySuggestions({ text: "rice", calories: 0, protein: 30 }),
    ).rejects.toThrow(/budget/);
    const result = await getPantrySuggestions({
      text: "beans, plantain",
      calories: 500,
      protein: 30,
    });
    expect(result.matched).toEqual([]);
    expect(result.ambiguous.length).toBe(2);
    expect(result.ideas).toEqual([]);
  });
});
