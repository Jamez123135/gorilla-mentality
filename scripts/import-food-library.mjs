import fs from "node:fs";

// Rebuild only from the official SR Legacy JSON download, never from guessed values.
const file = process.argv[2];
if (!file)
  throw new Error("Pass the path to the USDA SR Legacy JSON download.");
const records = JSON.parse(fs.readFileSync(file, "utf8")).SRLegacyFoods;
const selection = [
  [
    "chicken",
    171477,
    "Chicken breast, roasted",
    [],
    ["chicken", "chicken breast"],
  ],
  ["rice", 168878, "White rice, cooked", [], ["rice", "white rice"]],
  ["lentils", 172421, "Lentils, boiled, no salt", [], ["lentils"]],
  ["tofu", 172475, "Firm tofu, raw", ["soy"], ["tofu"]],
  [
    "yogurt",
    170894,
    "Greek yogurt, plain, nonfat",
    ["milk"],
    ["yogurt", "greek yogurt"],
  ],
  ["oats", 173904, "Oats, dry", [], ["oats", "oatmeal"]],
  ["banana", 173944, "Banana, raw", [], ["banana", "bananas"]],
  ["berries", 167762, "Strawberries, raw", [], ["strawberry", "strawberries"]],
  ["spinach", 168462, "Spinach, raw", [], ["spinach"]],
  ["broccoli", 169967, "Broccoli, boiled, no salt", [], ["broccoli"]],
  [
    "potato",
    170030,
    "Russet potato, baked with skin",
    [],
    ["potato", "potatoes"],
  ],
  ["oil", 171413, "Olive oil", [], ["oil", "olive oil"]],
  ["tuna", 173709, "Light tuna, canned in water, drained", ["fish"], ["tuna"]],
  ["salmon", 175168, "Atlantic salmon, farmed, cooked", ["fish"], ["salmon"]],
  [
    "peanut-butter",
    172470,
    "Peanut butter, smooth, no salt",
    ["peanut"],
    ["peanut butter"],
  ],
  [
    "bread",
    172688,
    "Whole-wheat bread",
    ["wheat"],
    ["bread", "whole wheat bread"],
  ],
  ["eggs", 173424, "Egg, hard-boiled", ["egg"], ["egg", "eggs"]],
  [
    "beans",
    173735,
    "Black beans, boiled, no salt",
    [],
    ["beans", "black beans"],
  ],
];
const foods = selection.map(([id, fdcId, name, allergens, aliases]) => {
  const food = records.find((record) => record.fdcId === fdcId);
  if (!food) throw new Error(`Missing USDA record ${fdcId}`);
  const nutrient = (number) => {
    const value = food.foodNutrients.find(
      (row) => row.nutrient.number === number,
    )?.amount;
    if (!Number.isFinite(value))
      throw new Error(`Missing nutrient ${number} for ${fdcId}`);
    return value;
  };
  return {
    id,
    fdcId,
    name,
    sourceDescription: food.description,
    allergens,
    aliases,
    per100g: {
      calories: nutrient("208"),
      protein: nutrient("203"),
      carbs: nutrient("205"),
      fat: nutrient("204"),
    },
  };
});
fs.writeFileSync(
  "app/data/foods.json",
  JSON.stringify(
    {
      source: "USDA FoodData Central SR Legacy, April 2018",
      sourceUrl: "https://fdc.nal.usda.gov/download-datasets/",
      foods,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Imported ${foods.length} verified USDA records.`);
