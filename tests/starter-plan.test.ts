import { describe, expect, it } from "vitest";
import { initialIntakeForm } from "@/app/data/starter-pack/options";
import { createStarterPlan, parseWeightInPounds } from "@/app/lib/starter-pack/plan-generator";
import { workoutSessions, exerciseDefaults } from "@/app/lib/workout-plan";
import { nutritionInput, workoutInput, profileInput } from "@/app/lib/validation";
import { createStarterPlanPdf } from "@/app/lib/starter-pack/pdf-export";
import { PDFDocument } from "pdf-lib";

describe("starter plans and saved routines", () => {
  for (const sex of ["male", "female"] as const) {
    for (const days of [3, 4, 5, 6]) {
      it(`${sex} ${days}-day dashboard routine matches the starter plan`, () => {
        const form = { ...initialIntakeForm, sex, days, weight: "82 kg", name: "Alex" };
        const plan = createStarterPlan(form);
        expect(plan.selectedSessions).toHaveLength(days);
        expect(workoutSessions(sex, days)).toEqual(plan.selectedSessions);
        expect(plan.nutrition.calories).toBeGreaterThan(0);
        expect(plan.nutrition.proteinMax).toBeGreaterThanOrEqual(plan.nutrition.proteinMin);
        for (const session of plan.selectedSessions) {
          for (const exercise of session.exercises) expect(exerciseDefaults(exercise.details).sets).toBeGreaterThan(0);
        }
      });
    }
  }
  it("converts kilograms consistently for nutrition and saved weight", () => {
    const pounds = parseWeightInPounds("82 kg", "male");
    expect(pounds).toBeCloseTo(180.78, 1);
    expect(createStarterPlan({ ...initialIntakeForm, weight: "82 kg" }).nutrition)
      .toEqual(createStarterPlan({ ...initialIntakeForm, weight: `${pounds} lb` }).nutrition);
  });
  it("exports a readable multi-page PDF", async () => {
    const form = { ...initialIntakeForm, name: "Alex", weight: "180 lb" };
    const blob = await createStarterPlanPdf(createStarterPlan(form), form.goal, form.days);
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});

describe("tracking input validation", () => {
  it("rejects invalid dates, negative nutrition, and non-finite values", () => {
    for (const input of [
      { calories: -1, protein: 20, date: "2026-10-12" },
      { calories: 2000, protein: 20, date: "2026-02-30" },
      { calories: NaN, protein: 20, date: "2026-10-12" },
    ]) expect(nutritionInput.safeParse(input).success).toBe(false);
    expect(nutritionInput.safeParse({ calories: 0, protein: 0, date: "2026-10-12" }).success).toBe(true);
  });
  it("rejects missing intake fields", () => {
    expect(profileInput.safeParse({ id: "someone-else" }).success).toBe(false);
  });
  it("rejects empty sets, duplicate sets, and fractional reps", () => {
    const set = { exerciseId: "exercise-1", weight: null, reps: 8, setNumber: 1, isCompleted: true };
    const workoutDate = new Date().toISOString();
    expect(workoutInput.safeParse({ workoutDate, sets: [] }).success).toBe(false);
    expect(workoutInput.safeParse({ workoutDate, sets: [set, set] }).success).toBe(false);
    expect(workoutInput.safeParse({ workoutDate, sets: [{ ...set, reps: 2.5 }] }).success).toBe(false);
    expect(workoutInput.safeParse({ workoutDate, sets: [{ ...set, reps: null }] }).success).toBe(false);
    expect(workoutInput.safeParse({ workoutDate, sets: [set] }).success).toBe(true);
  });
});
