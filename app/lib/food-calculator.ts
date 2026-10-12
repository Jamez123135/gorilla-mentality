import library from "@/app/data/foods.json";

export const foods = library.foods;
export type FoodPortion = { foodId: string; grams: number };
export function calculateFood(portions: FoodPortion[]) {
  if (!portions.length || portions.length > 20)
    throw new Error("Choose between 1 and 20 ingredients.");
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const portion of portions) {
    const food = foods.find((food) => food.id === portion.foodId);
    if (
      !food ||
      !Number.isFinite(portion.grams) ||
      portion.grams <= 0 ||
      portion.grams > 2000
    )
      throw new Error("Check your foods and gram amounts.");
    for (const nutrient of ["calories", "protein", "carbs", "fat"] as const)
      totals[nutrient] += (food.per100g[nutrient] * portion.grams) / 100;
  }
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

const recipes = [
  {
    name: "Chicken, rice and broccoli bowl",
    ingredients: [
      { foodId: "chicken", grams: 150 },
      { foodId: "rice", grams: 150 },
      { foodId: "broccoli", grams: 100 },
    ],
    steps:
      "Combine roasted chicken, cooked rice, and steamed or boiled broccoli. Add seasonings to taste.",
  },
  {
    name: "Tofu and rice bowl",
    ingredients: [
      { foodId: "tofu", grams: 180 },
      { foodId: "rice", grams: 150 },
      { foodId: "spinach", grams: 60 },
    ],
    steps:
      "Heat the tofu and cooked rice, then fold in spinach. Cook until the spinach wilts.",
  },
  {
    name: "Lentil and rice bowl",
    ingredients: [
      { foodId: "lentils", grams: 200 },
      { foodId: "rice", grams: 150 },
      { foodId: "spinach", grams: 60 },
    ],
    steps:
      "Warm the cooked lentils and rice together. Stir in spinach and your preferred seasonings.",
  },
  {
    name: "Egg and potato plate",
    ingredients: [
      { foodId: "eggs", grams: 150 },
      { foodId: "potato", grams: 200 },
      { foodId: "spinach", grams: 50 },
    ],
    steps:
      "Serve hard-boiled eggs with a baked potato and spinach. Weigh edible portions without shells.",
  },
  {
    name: "Tuna sandwich",
    ingredients: [
      { foodId: "tuna", grams: 130 },
      { foodId: "bread", grams: 70 },
      { foodId: "spinach", grams: 30 },
    ],
    steps:
      "Drain canned tuna, then layer it and spinach between slices of whole-wheat bread.",
  },
  {
    name: "Greek yogurt, banana and oats",
    ingredients: [
      { foodId: "yogurt", grams: 200 },
      { foodId: "oats", grams: 40 },
      { foodId: "banana", grams: 100 },
    ],
    steps:
      "Mix plain Greek yogurt and oats. Add sliced banana and refrigerate until the oats soften.",
  },
  {
    name: "Strawberry overnight oats",
    ingredients: [
      { foodId: "yogurt", grams: 200 },
      { foodId: "oats", grams: 50 },
      { foodId: "berries", grams: 100 },
    ],
    steps:
      "Mix yogurt and dry oats, top with strawberries, and refrigerate overnight.",
  },
  {
    name: "Black bean rice bowl",
    ingredients: [
      { foodId: "beans", grams: 200 },
      { foodId: "rice", grams: 150 },
      { foodId: "broccoli", grams: 100 },
    ],
    steps:
      "Combine warm cooked black beans, rice, and broccoli. Add seasonings to taste.",
  },
];

export function matchPantry(text: string) {
  const tokens = text
    .toLowerCase()
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter(Boolean);
  return {
    ids: [
      ...new Set(
        tokens.flatMap((token) =>
          foods
            .filter((food) => food.aliases.includes(token))
            .map((food) => food.id),
        ),
      ),
    ],
    unknown: tokens.filter(
      (token) => !foods.some((food) => food.aliases.includes(token)),
    ),
  };
}

export function pantryIdeas(
  ids: string[],
  excluded: string[],
  calories: number,
  protein: number,
) {
  if (!ids.length || calories <= 0) return [];
  return recipes
    .filter((recipe) =>
      recipe.ingredients.every(
        (portion) =>
          !foods
            .find((food) => food.id === portion.foodId)!
            .allergens.some((allergen) => excluded.includes(allergen)),
      ),
    )
    .filter((recipe) =>
      recipe.ingredients.some((portion) => ids.includes(portion.foodId)),
    )
    .map((recipe) => {
      const scale = Math.max(
        0.5,
        Math.min(2, calories / calculateFood(recipe.ingredients).calories),
      );
      const ingredients = recipe.ingredients.map((portion) => ({
        ...portion,
        grams: Math.round(portion.grams * scale),
      }));
      const totals = calculateFood(ingredients);
      const missing = ingredients
        .filter((portion) => !ids.includes(portion.foodId))
        .map(
          (portion) => foods.find((food) => food.id === portion.foodId)!.name,
        );
      return {
        ...recipe,
        ingredients,
        totals,
        missing,
        score:
          missing.length * 1000 +
          Math.abs(totals.calories - calories) +
          Math.max(0, protein - totals.protein) * 5,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}
