import { z } from "zod";
import { allergens, roles } from "./food-types";
export const foodIdInput = z.string().min(1).max(90);
export const pantryPreferencesInput = z.object({
  diet: z.enum(["any", "vegetarian", "vegan"]).default("any"),
  excluded: z.array(z.enum(allergens)).max(10).default([]),
  onlyAvailable: z.boolean().default(true),
  mealsRemaining: z.number().int().min(1).max(6).default(3),
  calories: z.number().min(100).max(2000).optional(),
  protein: z.number().min(0).max(200).optional(),
  carbsMax: z.number().min(0).max(400).optional(),
  fatMax: z.number().min(0).max(150).optional(),
});
export const suggestionInput = pantryPreferencesInput
  .omit({ mealsRemaining: true })
  .extend({
    text: z.string().max(2000).default(""),
    ids: z.array(foodIdInput).max(100).default([]),
    calories: z.number().min(100).max(2000),
    protein: z.number().min(0).max(200),
    carbsMax: z.number().min(0).max(400).optional(),
    fatMax: z.number().min(0).max(150).optional(),
  });
export const labelFoodInput = z
  .object({
    name: z.string().trim().min(1).max(120),
    brand: z.string().trim().max(80).default(""),
    reference: z.string().trim().min(3).max(240),
    servingGrams: z.number().positive().max(2000),
    calories: z.number().min(0).max(10000),
    protein: z.number().min(0).max(1000),
    carbs: z.number().min(0).max(1000),
    fat: z.number().min(0).max(1000),
    preparation: z.enum([
      "raw / uncooked",
      "dry",
      "cooked",
      "ready-to-eat",
      "as described",
    ]),
    role: z.enum(
      roles as [(typeof roles)[number], ...(typeof roles)[number][]],
    ),
    diet: z.enum(["unknown", "vegetarian", "vegan", "omnivore"]),
    allergens: z.array(z.enum(allergens)).max(10),
    labelReviewed: z.boolean(),
  })
  .superRefine((data, context) => {
    const factor = 100 / data.servingGrams;
    if (
      data.calories * factor > 1200 ||
      [data.protein, data.carbs, data.fat].some(
        (value) => value * factor > 105,
      ) ||
      (data.protein + data.carbs + data.fat) * factor > 105
    )
      context.addIssue({
        code: "custom",
        message: "Check the serving weight and per-serving label values.",
      });
    if (
      (data.diet === "vegan" &&
        data.allergens.some((allergen) =>
          ["milk", "egg", "fish", "shellfish"].includes(allergen),
        )) ||
      (data.diet === "vegetarian" &&
        data.allergens.some((allergen) =>
          ["fish", "shellfish"].includes(allergen),
        ))
    )
      context.addIssue({
        code: "custom",
        message: "Diet classification conflicts with declared allergens.",
      });
  });
