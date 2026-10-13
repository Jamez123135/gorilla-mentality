import Fuse, { type Expression } from "fuse.js";
import catalog from "@/app/data/food-catalog.json";
import type { FoodSummary } from "./food-types";
type CatalogFood = FoodSummary & {
  aliases: string[];
  sourceDescription: string;
};
export const catalogFoods = catalog.foods as CatalogFood[];
export const catalogCount = catalogFoods.length;
export const catalogCategories = [
  ...new Set(catalogFoods.map((food) => food.category)),
].sort();
const byId = new Map(catalogFoods.map((food) => [food.id, food]));
const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const descriptions = new Map<string, CatalogFood[]>();
for (const food of catalogFoods)
  for (const name of new Set([
    normalize(food.name),
    normalize(food.sourceDescription),
  ])) {
    descriptions.set(name, [...(descriptions.get(name) ?? []), food]);
  }
const index = new Fuse(catalogFoods, {
  keys: [
    { name: "name", weight: 0.55 },
    { name: "aliases", weight: 0.35 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.32,
  ignoreLocation: true,
  includeScore: true,
});
const featuredIds = [
  "chicken",
  "rice",
  "lentils",
  "tofu",
  "yogurt",
  "oats",
  "banana",
  "berries",
  "spinach",
  "broccoli",
  "potato",
  "oil",
  "tuna",
  "salmon",
  "peanut-butter",
  "bread",
  "eggs",
  "beans",
];
const common: Record<string, string> = {
  chickpeas: "fdc-173757",
  garbanzo: "fdc-173757",
  chana: "fdc-173757",
  quinoa: "fdc-168917",
  couscous: "fdc-169700",
  yam: "fdc-170072",
  yams: "fdc-170072",
  teff: "fdc-168918",
  bulgur: "fdc-170287",
  avocado: "fdc-171705",
  avocados: "fdc-171705",
  carrots: "fdc-170393",
  carrot: "fdc-170393",
  onion: "fdc-170000",
  onions: "fdc-170000",
  tomatoes: "fdc-170457",
  tomato: "fdc-170457",
  "brown rice": "fdc-169704",
  "bell pepper": "fdc-170108",
};
const exact = new Map<string, string>();
for (const id of featuredIds) {
  const food = byId.get(id);
  if (food)
    for (const alias of food.aliases)
      if (!["oil", "beans", "yogurt", "oatmeal"].includes(alias))
        exact.set(normalize(alias), id);
}
for (const [alias, id] of Object.entries(common))
  if (byId.has(id)) exact.set(normalize(alias), id);
export function publicFood(food: CatalogFood | FoodSummary): FoodSummary {
  const {
    id,
    name,
    category,
    preparation,
    source,
    sourceUrl,
    fdcId,
    per100g,
    allergens,
    allergenReview,
    vegetarian,
    vegan,
    role,
    portions,
    recipeEligible,
  } = food;
  return {
    id,
    name,
    category,
    preparation,
    source,
    sourceUrl,
    fdcId,
    per100g,
    allergens,
    allergenReview,
    vegetarian,
    vegan,
    role,
    portions,
    recipeEligible,
  };
}
export function officialFood(id: string) {
  const food = byId.get(id);
  return food ? publicFood(food) : null;
}
export function searchCatalog(
  query: string,
  category = "",
  take = 40,
): FoodSummary[] {
  const normalized = normalize(query);
  const terms = normalized.split(" ").filter(Boolean);
  const ranked =
    terms.length > 1
      ? index.search({
          $and: terms.map<Expression>((term) => ({
            $or: ["name", "aliases"].map<Expression>((key) => ({
              [key]: term,
            })),
          })),
        })
      : index.search(query.trim());
  const precise =
    terms.length > 1
      ? index
          .search(query.trim())
          .filter((result) => (result.score ?? 1) < 0.001)
          .map((result) => result.item)
      : [];
  ranked.sort(
    (a, b) =>
      (a.score ?? 1) +
      (a.item.recipeEligible ? 0 : 0.04) -
      ((b.score ?? 1) + (b.item.recipeEligible ? 0 : 0.04)),
  );
  const preferred = byId.get(exact.get(normalized) ?? "");
  const matches = normalized
    ? [
        ...(preferred ? [preferred] : []),
        ...precise,
        ...ranked.map((result) => result.item),
      ]
    : [
        ...featuredIds.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : [])),
        ...catalogFoods,
      ];
  const seen = new Set<string>();
  return matches
    .filter(
      (food) =>
        (!category || food.category === category) &&
        !seen.has(food.id) &&
        Boolean(seen.add(food.id)),
    )
    .slice(0, Math.min(40, take))
    .map(publicFood);
}
export function resolvePantry(text: string, personal: FoodSummary[] = []) {
  const matched: FoodSummary[] = [];
  const unknown: string[] = [];
  const ambiguous: { token: string; options: FoodSummary[] }[] = [];
  const seen = new Set<string>();
  const tokens = text
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length > 50)
    throw new Error(
      "Use at most 50 typed ingredients; confirm additional foods with the pantry picker.",
    );
  for (const original of tokens) {
    const token = normalize(
      original.replace(
        /^\d+(?:\.\d+)?\s*(?:g|grams?|kg|oz|cups?|tbsp|tsp)\s+/i,
        "",
      ),
    );
    if (!token || seen.has(token)) continue;
    seen.add(token);
    const privateMatch = personal.filter(
      (food) => normalize(food.name) === token,
    );
    const id = exact.get(token);
    if (privateMatch.length === 1) {
      matched.push(privateMatch[0]);
      continue;
    }
    if (id) {
      matched.push(publicFood(byId.get(id)!));
      continue;
    }
    const named = descriptions.get(token) ?? [];
    if (named.length === 1) {
      matched.push(publicFood(named[0]));
      continue;
    }
    const options = [...privateMatch, ...searchCatalog(token, "", 5)];
    if (options.length) ambiguous.push({ token: original, options });
    else unknown.push(original);
  }
  return {
    foods: [...new Map(matched.map((food) => [food.id, food])).values()],
    unknown,
    ambiguous,
  };
}
