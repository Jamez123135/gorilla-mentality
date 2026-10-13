import { catalogFoods, officialFood, resolvePantry } from "./food-catalog";
import { sumFood, type FoodPortion } from "./food-types";
import { buildPantryIdeas } from "./pantry-planner";
export const foods = catalogFoods;
export type { FoodPortion } from "./food-types";
export function calculateFood(portions: FoodPortion[]) {
  return sumFood(portions, catalogFoods);
}
export function matchPantry(text: string) {
  const resolved = resolvePantry(text);
  return {
    ids: resolved.foods.map((food) => food.id),
    unknown: [
      ...resolved.unknown,
      ...resolved.ambiguous.map((entry) => entry.token),
    ],
  };
}
export function pantryIdeas(
  ids: string[],
  excluded: string[],
  calories: number,
  protein: number,
) {
  const selected = ids.flatMap((id) =>
    officialFood(id) ? [officialFood(id)!] : [],
  );
  const defaults = [
    "chicken",
    "rice",
    "broccoli",
    "tofu",
    "lentils",
    "spinach",
    "yogurt",
    "oats",
    "banana",
    "beans",
  ].flatMap((id) => (officialFood(id) ? [officialFood(id)!] : []));
  return buildPantryIdeas(selected, defaults, {
    diet: "any",
    excluded,
    calories,
    protein,
    onlyAvailable: false,
  });
}
