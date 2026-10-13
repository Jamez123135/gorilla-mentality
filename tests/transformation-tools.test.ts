import { describe, expect, it } from "vitest";
import {
  calculateFood,
  foods,
  matchPantry,
  pantryIdeas,
} from "@/app/lib/food-calculator";
import { musclePriorities } from "@/app/lib/muscle-priority";
import { createStarterPlan } from "@/app/lib/starter-pack/plan-generator";
import { workoutSessions, routineKey } from "@/app/lib/workout-plan";
import { workoutFeedback } from "@/app/lib/workout-feedback";

describe("verified food calculator", () => {
  it("uses USDA data scaled to gram portions", () => {
    const food = foods.find((food) => food.id === "chicken")!;
    expect(calculateFood([{ foodId: "chicken", grams: 200 }])).toEqual({
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7.1,
    });
    expect(food.fdcId).toBe(171477);
  });
  it("adds mixed portions and rejects unknown or invalid quantities", () => {
    expect(
      calculateFood([
        { foodId: "rice", grams: 100 },
        { foodId: "chicken", grams: 100 },
      ]).calories,
    ).toBe(295);
    for (const grams of [0, -1, NaN, Infinity, 2001])
      expect(() => calculateFood([{ foodId: "rice", grams }])).toThrow();
    expect(() => calculateFood([{ foodId: "made-up", grams: 100 }])).toThrow();
    expect(() => calculateFood([])).toThrow();
  });
  it("matches pantry inputs explicitly and exposes unsupported ingredients", () => {
    expect(matchPantry("Chicken, rice, broccoli, unknown")).toEqual({
      ids: ["chicken", "rice", "broccoli"],
      unknown: ["unknown"],
    });
    expect(
      pantryIdeas(["chicken", "rice", "broccoli"], [], 500, 35)[0].missing,
    ).toEqual([]);
  });
  it("excludes allergens and never offers meals for a zero calorie budget", () => {
    const ideas = pantryIdeas(["yogurt", "oats", "banana"], ["milk"], 500, 35);
    expect(
      ideas.every((idea) =>
        idea.ingredients.every(
          (portion) =>
            !foods
              .find((food) => food.id === portion.foodId)!
              .allergens.includes("milk"),
        ),
      ),
    ).toBe(true);
    expect(pantryIdeas(["rice"], [], 0, 30)).toEqual([]);
    expect(pantryIdeas([], [], 500, 30)).toEqual([]);
  });
});

describe("muscle priorities", () => {
  for (const musclePriority of musclePriorities)
    it(`keeps intake and dashboard consistent for ${musclePriority}`, () => {
      const plan = createStarterPlan({
        name: "Alex",
        age: "28",
        height: "178 cm",
        weight: "180 lb",
        sex: "male",
        goal: "muscle",
        experience: "new",
        days: 3,
        musclePriority,
      });
      expect(plan.selectedSessions).toEqual(
        workoutSessions("male", 3, musclePriority),
      );
      const base = workoutSessions("male", 3);
      for (let index = 0; index < base.length; index++) {
        expect(
          plan.selectedSessions[index].exercises.length,
        ).toBeLessThanOrEqual(base[index].exercises.length + 1);
        for (const exercise of base[index].exercises)
          expect(plan.selectedSessions[index].exercises).toContainEqual(
            exercise,
          );
      }
    });
  it("keeps the legacy balanced key and isolates focused scheduling", () => {
    const profile = {
      sex: "male",
      trainingDays: 3,
      goal: "muscle",
      trainingExperience: "new",
    };
    expect(routineKey(profile)).toBe(
      routineKey({ ...profile, musclePriority: "balanced" }),
    );
    expect(routineKey(profile)).not.toBe(
      routineKey({ ...profile, musclePriority: "glutes" }),
    );
  });
});

describe("session feedback", () => {
  it("uses only checked sets in feedback and recognizes partial sessions", () => {
    const result = workoutFeedback(
      [
        { weight: 100, reps: 8, isCompleted: true },
        { weight: 200, reps: 10, isCompleted: false },
      ],
      10,
    );
    expect(result.completed).toBe(1);
    expect(result.volume).toBe(800);
    expect(result.advice).toMatch(/Partial session/);
  });
  it("prioritizes too-heavy effort without pushing an increase", () => {
    expect(
      workoutFeedback(
        [{ weight: 100, reps: 8, isCompleted: true }],
        1,
        "too-heavy",
      ).advice,
    ).toMatch(/Reduce the load/);
  });
});
