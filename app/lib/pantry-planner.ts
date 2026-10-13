import {
  sumFood,
  type FoodSummary,
  type FoodPortion,
  type PantryOptions,
} from "./food-types";
export function allowedFood(food: FoodSummary, options: PantryOptions) {
  if (options.excluded.some((allergen) => food.allergens.includes(allergen)))
    return false;
  if (options.excluded.length && food.allergenReview === "unverified")
    return false;
  if (options.diet === "vegetarian" && food.vegetarian !== true) return false;
  if (options.diet === "vegan" && food.vegan !== true) return false;
  return food.recipeEligible;
}
function limits(food: FoodSummary): [number, number, number] {
  if (food.role === "fat") return [3, 25, 8];
  if (food.role === "vegetable" || food.role === "fruit") return [50, 250, 100];
  if (food.role === "starch")
    return food.per100g.calories > 250 ? [20, 120, 55] : [50, 350, 150];
  if (food.role === "protein")
    return /yogurt|milk/i.test(food.name) ? [80, 350, 200] : [60, 300, 150];
  return [20, 200, 100];
}
export function fitPortions(records: FoodSummary[], options: PantryOptions) {
  const bounds = records.map(limits);
  const score = (grams: number[]) => {
    const totals = sumFood(
      records.map((food, index) => ({ foodId: food.id, grams: grams[index] })),
      records,
    );
    return (
      Math.abs(totals.calories - options.calories) * 0.7 +
      Math.max(0, totals.calories - options.calories) * 4 +
      Math.max(0, options.protein - totals.protein) * 13 +
      (options.carbsMax === undefined
        ? 0
        : Math.max(0, totals.carbs - options.carbsMax) * 10) +
      (options.fatMax === undefined
        ? 0
        : Math.max(0, totals.fat - options.fatMax) * 15)
    );
  };
  let best = bounds.map((bound) => bound[2]);
  let bestScore = score(best);
  for (let iteration = 0; iteration < 35; iteration++) {
    let changed = false;
    for (let index = 0; index < records.length; index++)
      for (const direction of [-1, 1]) {
        const next = [...best];
        next[index] = Math.max(
          bounds[index][0],
          Math.min(
            bounds[index][1],
            next[index] + direction * (records[index].role === "fat" ? 1 : 5),
          ),
        );
        const value = score(next);
        if (value < bestScore) {
          best = next;
          bestScore = value;
          changed = true;
        }
      }
    if (!changed) break;
  }
  const ingredients: FoodPortion[] = records.map((food, index) => ({
    foodId: food.id,
    grams: best[index],
  }));
  const totals = sumFood(ingredients, records);
  const gaps = [
    totals.calories > options.calories ? "Above calorie budget" : null,
    totals.protein < options.protein ? "Below protein target" : null,
    options.carbsMax !== undefined && totals.carbs > options.carbsMax
      ? "Above carbohydrate limit"
      : null,
    options.fatMax !== undefined && totals.fat > options.fatMax
      ? "Above fat limit"
      : null,
  ].filter((gap): gap is string => Boolean(gap));
  return { ingredients, totals, gaps, score: bestScore };
}
export function buildPantryIdeas(
  available: FoodSummary[],
  staples: FoodSummary[],
  options: PantryOptions,
) {
  if (
    !Number.isFinite(options.calories) ||
    options.calories < 100 ||
    options.calories > 2000 ||
    !Number.isFinite(options.protein) ||
    options.protein < 0 ||
    options.protein > 200 ||
    (options.carbsMax !== undefined &&
      (!Number.isFinite(options.carbsMax) ||
        options.carbsMax < 0 ||
        options.carbsMax > 400)) ||
    (options.fatMax !== undefined &&
      (!Number.isFinite(options.fatMax) ||
        options.fatMax < 0 ||
        options.fatMax > 150))
  )
    return [];
  const selected = available.filter((food) => allowedFood(food, options));
  if (!selected.length) return [];
  const pool = [
    ...new Map(
      [
        ...selected,
        ...(options.onlyAvailable
          ? []
          : staples.filter((food) => allowedFood(food, options))),
      ].map((food) => [food.id, food]),
    ).values(),
  ];
  // Bound optimization work for large saved pantries on serverless instances.
  const group = (role: string) =>
    pool.filter((food) => food.role === role).slice(0, 6);
  const combinations: FoodSummary[][] = [];
  for (const protein of group("protein")) {
    for (const starch of group("starch"))
      for (const vegetable of group("vegetable"))
        combinations.push([protein, starch, vegetable]);
    for (const fruit of group("fruit"))
      combinations.push([
        protein,
        fruit,
        ...group("starch")
          .filter((food) => /oat|bread/i.test(food.name))
          .slice(0, 1),
      ]);
    for (const vegetable of group("vegetable"))
      combinations.push([protein, vegetable]);
  }
  for (const starch of group("starch"))
    for (const vegetable of group("vegetable"))
      combinations.push([starch, vegetable]);
  if (!combinations.length) combinations.push(selected.slice(0, 4));
  const availableIds = new Set(available.map((food) => food.id));
  const short = (food: FoodSummary) => food.name.split(",")[0];
  return combinations
    .filter((records) => records.some((food) => availableIds.has(food.id)))
    .map((records) => {
      const fat = selected.find(
        (food) =>
          food.role === "fat" &&
          !records.some((record) => record.id === food.id),
      );
      const chosen = fat ? [...records, fat] : records;
      const fit = fitPortions(chosen, options);
      const missing = chosen
        .filter((food) => !availableIds.has(food.id))
        .map((food) => food.name);
      let name = chosen.slice(0, 3).map(short).join(", ") + " plate";
      if (
        chosen
          .slice(0, 3)
          .map((food) => food.id)
          .join(":") === "chicken:rice:broccoli"
      )
        name = "Chicken, rice and broccoli bowl";
      const steps =
        chosen
          .map((food) =>
            food.preparation === "dry" ||
            (food.preparation === "raw / uncooked" && food.role === "starch")
              ? `Cook ${short(food).toLowerCase()} as directed; the grams are dry weight.`
              : food.preparation === "raw / uncooked" && food.role === "protein"
                ? `Prepare ${short(food).toLowerCase()} according to its package directions; weigh the listed uncooked portion first.`
                : food.preparation === "cooked" ||
                    food.preparation.startsWith("canned")
                  ? `Use the listed cooked/as-described portion of ${short(food).toLowerCase()}.`
                  : `Prepare ${short(food).toLowerCase()} in its listed state.`,
          )
          .join(" ") +
        " Combine the portions. Log any additional oil, sauce, or seasoning.";
      return {
        name,
        ...fit,
        missing,
        foods: chosen,
        steps,
        score: missing.length * 2000 + fit.score,
        warnings: chosen.some((food) => food.allergenReview === "unverified")
          ? ["Allergen declarations unverified: check product labels."]
          : [],
      };
    })
    .sort((a, b) => a.score - b.score)
    .filter(
      (idea, index, all) =>
        all.findIndex((other) => other.name === idea.name) === index,
    )
    .slice(0, 6);
}
