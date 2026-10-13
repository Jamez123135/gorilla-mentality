import { prisma } from "./prisma";
import { officialFood } from "./food-catalog";
import type { CustomFood } from "@prisma/client";
import type { FoodSummary, FoodRole } from "./food-types";
export function labelFood(row: CustomFood): FoodSummary {
  return {
    id: `custom:${row.id}`,
    name: row.brand ? `${row.name} (${row.brand})` : row.name,
    category: "Personal label foods",
    preparation: row.preparation,
    source: `Your label: ${row.reference}`,
    sourceUrl: null,
    fdcId: null,
    per100g: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    allergens: row.allergens,
    allergenReview: row.labelReviewed ? "label" : "unverified",
    vegetarian:
      row.diet === "vegan" || row.diet === "vegetarian"
        ? true
        : row.diet === "omnivore"
          ? false
          : null,
    vegan: row.diet === "vegan" ? true : row.diet === "unknown" ? null : false,
    role: row.role as FoodRole,
    portions:
      row.servingGrams && row.servingGrams > 0
        ? [
            {
              label:
                row.referenceBasis === "100g"
                  ? "100g label reference"
                  : row.referenceBasis === "custom"
                    ? "Label reference portion"
                    : "1 label serving",
              grams: row.servingGrams,
            },
          ]
        : [],
    recipeEligible:
      row.role !== "other" && row.preparation !== "raw / uncooked",
  };
}
export async function resolveOwnedFoods(userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const personalIds = unique
    .filter((id) => id.startsWith("custom:"))
    .map((id) => id.slice(7));
  const rows = personalIds.length
    ? await prisma.customFood.findMany({
        where: { userId, id: { in: personalIds } },
      })
    : [];
  const privateMap = new Map(
    rows.map((row) => [`custom:${row.id}`, labelFood(row)]),
  );
  return unique.map((id) => {
    const food = id.startsWith("custom:")
      ? privateMap.get(id)
      : officialFood(id);
    if (!food)
      throw new Error("A selected food is unavailable. Choose it again.");
    return food;
  });
}
