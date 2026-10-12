import { beforeEach, describe, expect, it, vi } from "vitest";
import { mealTotals } from "@/app/lib/tracking-summary";
import { mealInput, weightInput } from "@/app/lib/validation";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: { findUnique: vi.fn(), upsert: vi.fn() },
  mealEntry: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  weightEntry: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  nutritionLog: { findUnique: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/prisma", () => ({ prisma: mocks }));
import {
  getNutritionDiary,
  saveMeal,
  deleteMeal,
} from "@/app/lib/actions/meals";
import { saveWeight, deleteWeight } from "@/app/lib/actions/weight";

const meal = {
  date: "2026-10-12",
  name: "Chicken and rice",
  mealType: "lunch",
  portion: "1 bowl",
  calories: 600,
  protein: 45,
  carbs: 65,
  fat: 15,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "owner" });
});
describe("member diary", () => {
  it("keeps old manual totals and new meals without overwriting either", () => {
    expect(mealTotals([meal], { calories: 200, protein: 10 })).toEqual({
      calories: 800,
      protein: 55,
      carbs: 65,
      fat: 15,
    });
  });
  it("accepts decimal macros and rejects invalid food entries", () => {
    expect(mealInput.safeParse({ ...meal, protein: 45.5 }).success).toBe(true);
    expect(
      mealInput.safeParse({ ...meal, name: " ", calories: -1 }).success,
    ).toBe(false);
    expect(
      weightInput.safeParse({ date: "2026-10-12", weight: -82, unit: "kg" })
        .success,
    ).toBe(false);
  });
  it("filters the diary by owner and selected date", async () => {
    mocks.mealEntry.findMany.mockResolvedValue([]);
    await getNutritionDiary(meal.date);
    expect(mocks.mealEntry.findMany.mock.calls[0][0].where).toEqual({
      userId: "owner",
      logDate: new Date("2026-10-12T00:00:00.000Z"),
    });
  });
  it("creates a profile and stores the meal for the authenticated owner", async () => {
    await saveMeal({ ...meal, userId: "victim" });
    expect(mocks.mealEntry.create.mock.calls[0][0].data.userId).toBe("owner");
    expect(mocks.profile.upsert.mock.calls[0][0].create.id).toBe("owner");
  });
  it("cannot edit or delete somebody else's meal", async () => {
    mocks.mealEntry.updateMany.mockResolvedValue({ count: 0 });
    mocks.mealEntry.deleteMany.mockResolvedValue({ count: 0 });
    await expect(saveMeal({ ...meal, id: "foreign" })).rejects.toThrow(
      "Meal not found",
    );
    await expect(deleteMeal("foreign")).rejects.toThrow("Meal not found");
    expect(mocks.mealEntry.updateMany.mock.calls[0][0].where.userId).toBe(
      "owner",
    );
    expect(mocks.mealEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: "foreign", userId: "owner" },
    });
  });
  it("normalizes kilograms and updates a single daily weight entry", async () => {
    await saveWeight({ date: meal.date, weight: 82, unit: "kg" });
    expect(
      mocks.weightEntry.upsert.mock.calls[0][0].update.weightLb,
    ).toBeCloseTo(180.78, 2);
    expect(
      mocks.weightEntry.upsert.mock.calls[0][0].where.userId_logDate.userId,
    ).toBe("owner");
  });
  it("protects weight deletion and rejects signed-out meal saves", async () => {
    mocks.weightEntry.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteWeight("foreign")).rejects.toThrow();
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(saveMeal(meal)).rejects.toThrow("Unauthorized");
    expect(mocks.mealEntry.create).not.toHaveBeenCalled();
  });
});
