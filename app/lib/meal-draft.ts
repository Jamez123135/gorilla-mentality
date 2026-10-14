import type { FoodPortion, FoodSummary, Macros } from "./food-types";
export type MealDraft = Macros & {
  name: string;
  mealType: string;
  portion: string;
  portions: FoodPortion[];
  foods: FoodSummary[];
};
export function ingredientPortion(portions: FoodPortion[], foods: FoodSummary[]) {
  const text = portions.map((item) => `${item.grams}g ${foods.find((food) => food.id === item.foodId)?.name ?? "food"}`).join(", ");
  return text.length > 120 ? `${portions.length} weighed ingredients` : text;
}
