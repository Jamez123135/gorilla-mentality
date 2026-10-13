export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type FoodRole =
  "protein" | "starch" | "vegetable" | "fruit" | "fat" | "other";
export type FoodSummary = {
  id: string;
  name: string;
  category: string;
  preparation: string;
  source: string;
  sourceUrl: string | null;
  fdcId: number | null;
  per100g: Macros;
  allergens: string[];
  allergenReview: "inferred" | "unverified" | "label";
  vegetarian: boolean | null;
  vegan: boolean | null;
  role: FoodRole;
  portions: { label: string; grams: number }[];
  recipeEligible: boolean;
};
export type FoodPortion = { foodId: string; grams: number };
export type PantryOptions = {
  diet: "any" | "vegetarian" | "vegan";
  excluded: string[];
  calories: number;
  protein: number;
  carbsMax?: number;
  fatMax?: number;
  onlyAvailable: boolean;
};
export const allergens = [
  "milk",
  "egg",
  "fish",
  "shellfish",
  "tree-nut",
  "peanut",
  "wheat",
  "soy",
  "sesame",
  "gluten",
] as const;
export const roles: FoodRole[] = [
  "protein",
  "starch",
  "vegetable",
  "fruit",
  "fat",
  "other",
];

export function sumFood(
  portions: FoodPortion[],
  records: FoodSummary[],
): Macros {
  if (!portions.length || portions.length > 30)
    throw new Error("Choose between 1 and 30 ingredients.");
  const lookup = new Map(records.map((food) => [food.id, food]));
  const totals: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const portion of portions) {
    const food = lookup.get(portion.foodId);
    if (
      !food ||
      !Number.isFinite(portion.grams) ||
      portion.grams <= 0 ||
      portion.grams > 2000
    )
      throw new Error("Check your foods and gram amounts.");
    for (const key of ["calories", "protein", "carbs", "fat"] as const)
      totals[key] += (food.per100g[key] * portion.grams) / 100;
  }
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}
