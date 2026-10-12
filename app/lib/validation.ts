import { z } from "zod";
import { musclePriorities } from "@/app/lib/muscle-priority";

export const profileInput = z.object({
  fullName: z.string().trim().min(1).max(120),
  sex: z.enum(["male", "female"]),
  goal: z.enum(["fat-loss", "muscle", "recomp"]),
  currentWeight: z.number().positive().max(2000),
  trainingExperience: z.enum(["new", "returning", "consistent"]),
  trainingDays: z.number().int().min(3).max(6),
  targetCalories: z.number().int().min(1).max(10000),
  targetProtein: z.number().int().min(1).max(1000),
  musclePriority: z.enum(musclePriorities).default("balanced"),
});

export const nutritionInput = z.object({
  calories: z.number().int().min(0).max(20000),
  protein: z.number().int().min(0).max(2000),
  date: z.iso.date(),
});

export const mealInput = z.object({
  id: z.string().min(1).optional(),
  date: z.iso.date(),
  name: z.string().trim().min(1).max(160),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
  portion: z.string().trim().max(120).default(""),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(1000),
});

export const weightInput = z.object({
  date: z.iso.date(),
  weight: z.number().positive().max(2000),
  unit: z.enum(["lb", "kg"]),
});

export const workoutInput = z
  .object({
    workoutDate: z.iso.datetime(),
    dayNumber: z.number().int().min(1).max(6).default(1),
    finished: z.boolean().default(false),
    effort: z
      .enum(["comfortable", "challenging", "too-heavy"])
      .nullable()
      .default(null),
    sets: z
      .array(
        z
          .object({
            exerciseId: z.string().min(1),
            weight: z.number().min(0).max(3000).nullable(),
            reps: z.number().int().min(0).max(1000).nullable(),
            setNumber: z.number().int().min(1).max(20),
            isCompleted: z.boolean(),
          })
          .refine(
            (set) => set.weight !== null || set.reps !== null,
            "Enter weight or reps for each set",
          ),
      )
      .min(1)
      .max(200),
  })
  .superRefine((input, ctx) => {
    const keys = input.sets.map((set) => `${set.exerciseId}:${set.setNumber}`);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate sets are not allowed",
        path: ["sets"],
      });
    }
  });

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
