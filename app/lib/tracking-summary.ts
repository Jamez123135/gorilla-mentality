type Macros = { calories: number; protein: number; carbs: number; fat: number };

export function mealTotals(
  meals: Macros[],
  legacy?: { calories: number | null; protein: number | null } | null,
) {
  return meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
    }),
    {
      calories: legacy?.calories ?? 0,
      protein: legacy?.protein ?? 0,
      carbs: 0,
      fat: 0,
    },
  );
}
