import fs from "node:fs";
import { createHash } from "node:crypto";
const paths = process.argv.slice(2);
if (!paths.length)
  throw new Error(
    "Provide USDA SR Legacy, optional Foundation and optional FNDDS JSON paths.",
  );
const featured = JSON.parse(
  fs.readFileSync("app/data/foods.json", "utf8"),
).foods;
const featuredById = new Map(featured.map((food) => [food.fdcId, food]));
const sources = [];
const foods = [];
let skipped = 0;
for (const path of paths) {
  const raw = fs.readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  const key = Object.keys(data).find((key) => Array.isArray(data[key]));
  const source =
    key === "FoundationFoods"
      ? "USDA Foundation (April 2026)"
      : key === "SurveyFoods"
        ? "USDA FNDDS (2021-2023)"
        : "USDA SR Legacy (2018)";
  sources.push({
    source,
    sha256: createHash("sha256").update(raw).digest("hex"),
    records: data[key].length,
  });
  for (const record of data[key]) {
    if (
      !record ||
      typeof record.description !== "string" ||
      !Number.isInteger(record.fdcId)
    ) {
      skipped++;
      continue;
    }
    const nutrient = (id) =>
      record.foodNutrients?.find((row) => row.nutrient?.id === id)?.amount;
    const calories = nutrient(1008) ?? nutrient(2048) ?? nutrient(2047);
    const per100g = {
      calories,
      protein: nutrient(1003),
      carbs: nutrient(1005),
      fat: nutrient(1004),
    };
    if (
      Object.values(per100g).some(
        (value) => !Number.isFinite(value) || value < 0,
      ) ||
      calories > 1200 ||
      per100g.protein > 110 ||
      per100g.carbs > 110 ||
      per100g.fat > 110
    ) {
      skipped++;
      continue;
    }
    const preferred = featuredById.get(record.fdcId);
    const name = preferred?.name ?? record.description;
    const category =
      record.foodCategory?.description ??
      record.wweiaFoodCategory?.wweiaFoodCategoryDescription ??
      "Other foods";
    const lower = record.description.toLowerCase();
    const preparation = /\b(raw|uncooked|unprepared)\b/.test(lower)
      ? "raw / uncooked"
      : /\bdry\b/.test(lower)
        ? "dry"
        : /\b(cooked|roasted|boiled|baked|fried|grilled|stewed)\b/.test(lower)
          ? "cooked"
          : /\bcanned\b/.test(lower)
            ? "canned / check drained state"
            : /\bdried\b/.test(lower)
              ? "dried"
              : "as described";
    const detected = new Set(preferred?.allergens ?? []);
    for (const [tag, pattern] of [
      ["milk", /milk|cheese|yogurt|yoghurt|whey|\bbutter\b|cream|kefir/],
      ["egg", /\beggs?\b/],
      [
        "fish",
        /\bfish\b|salmon|tuna|cod,|sardine|tilapia|mackerel|anchov|trout|catfish|herring/,
      ],
      [
        "shellfish",
        /crustacean|shrimp|prawn|lobster|\bcrab\b|clam|oyster|mussel|scallop/,
      ],
      [
        "tree-nut",
        /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|pine nut/,
      ],
      ["peanut", /peanut|groundnut/],
      ["soy", /soy|tofu|tempeh|edamame|miso/],
      ["sesame", /sesame|tahini/],
      ["wheat", /\bwheat\b|bulgur|couscous|semolina|seitan/],
      [
        "gluten",
        /\bwheat\b|barley|\brye\b|bulgur|couscous|semolina|seitan|\boats\b/,
      ],
    ])
      if (pattern.test(lower)) detected.add(tag);
    if (
      /coconut|soy|almond|oat|rice|cashew/.test(lower) &&
      /milk|cream|butter/.test(lower) &&
      !/Dairy/.test(category)
    )
      detected.delete("milk");
    if (/peanut butter|almond butter|cashew butter|tofu yogurt/.test(lower))
      detected.delete("milk");
    let role = "other";
    let vegetarian = null;
    let vegan = null;
    const plain =
      !/with (?!salt|calcium|magnesium)|breaded|battered|restaurant|sandwich|pizza|casserole|dinner|meal,|fast food|soup|infant|baby food/i.test(
        lower,
      );
    if (/Poultry|Beef|Pork|Lamb|Finfish/.test(category)) {
      vegetarian = false;
      vegan = false;
      if (plain && per100g.protein >= 10) role = "protein";
    } else if (/Dairy and Egg/.test(category)) {
      vegetarian = true;
      vegan = false;
      if (plain && per100g.protein >= 4) role = "protein";
    } else if (/Legumes/.test(category)) {
      vegetarian = true;
      vegan = true;
      if (plain && per100g.protein >= 4) role = "protein";
    } else if (/Cereal Grains/.test(category)) {
      vegetarian = true;
      vegan = true;
      if (plain && per100g.carbs >= 10) role = "starch";
    } else if (/Vegetables/.test(category)) {
      vegetarian = true;
      vegan = true;
      if (plain)
        role = /potato|\byam\b|cassava|taro|corn,|sweetcorn|plantain/.test(
          lower,
        )
          ? "starch"
          : "vegetable";
    } else if (/Fruits/.test(category)) {
      vegetarian = true;
      vegan = true;
      if (plain && !/juice|nectar|syrup|fruit salad|baby/.test(lower))
        role = /plantain|breadfruit/.test(lower) ? "starch" : "fruit";
    } else if (/Nut and Seed/.test(category)) {
      vegetarian = true;
      vegan = true;
      if (plain) role = "fat";
    } else if (/Fats and Oils/.test(category)) {
      vegetarian = !/lard|tallow|fish oil/.test(lower);
      vegan = vegetarian && !/\bbutter\b/.test(lower);
      if (plain) role = "fat";
    }
    const mixed =
      !plain ||
      /mayonnaise|dressing|margarine|spread|paste|soba|noodles|pasta|macaroni|spaghetti|bread,|tortilla/.test(
        lower,
      );
    if (mixed) {
      vegetarian = null;
      vegan = null;
    }
    if (
      plain &&
      /^(bread,|tortillas?,|noodles,|pasta,|macaroni,|spaghetti,)/.test(lower)
    )
      role = "starch";
    // Condiments and raw baking ingredients remain searchable, not meal bases.
    if (
      /soy sauce|\bmiso\b|\bflour\b|protein powder|isolate|concentrate|dried milk|milk, dry|egg, dried/.test(
        lower,
      )
    )
      role = "other";
    if (
      /with (meat|chicken|beef|pork)|bacon|beef|chicken|pork|fish|lamb|gelatin/.test(
        lower,
      )
    ) {
      vegetarian = false;
      vegan = false;
    } else if (
      detected.has("milk") ||
      detected.has("egg") ||
      /honey/.test(lower)
    )
      vegan = false;
    const uncooked = /\b(raw|uncooked|unprepared)\b/.test(lower);
    let recipeEligible =
      plain &&
      role !== "other" &&
      (!uncooked ||
        (role === "starch" && /Cereal Grains/.test(category)) ||
        (role === "protein" && /^tofu,/.test(lower)) ||
        (role === "vegetable" &&
          !/cassava|taro|mushroom|beans|sprout/.test(lower)) ||
        role === "fruit" ||
        role === "fat");
    if (
      role === "protein" &&
      vegetarian === false &&
      preparation !== "cooked" &&
      !preparation.startsWith("canned")
    )
      recipeEligible = false;
    const portions = (record.foodPortions ?? [])
      .flatMap((portion) => {
        const amount = portion.amount ?? portion.value ?? 1;
        const unit = portion.measureUnit?.name;
        const label =
          `${amount} ${unit && unit !== "undetermined" ? unit : ""} ${portion.modifier ?? ""}`
            .replace(/\s+/g, " ")
            .trim();
        return Number.isFinite(portion.gramWeight) &&
          portion.gramWeight > 0 &&
          label
          ? [{ label, grams: portion.gramWeight }]
          : [];
      })
      .slice(0, 6);
    const aliases = [
      ...new Set([
        ...(preferred?.aliases ?? []),
        lower.split(",")[0],
        name.toLowerCase(),
      ]),
    ];
    const extra = {
      "chickpeas (garbanzo beans": ["chickpeas", "garbanzo", "chana", "chole"],
      eggplant: ["aubergine", "brinjal"],
      zucchini: ["courgette"],
      cilantro: ["coriander leaves"],
      cowpeas: ["black eyed peas", "black-eyed peas"],
      cassava: ["yuca", "manioc"],
      okra: ["lady fingers", "bhindi"],
      "mung beans": ["moong", "green gram"],
      "pigeon peas": ["gungo peas", "toor dal"],
      peanuts: ["groundnuts"],
      taro: ["dasheen", "cocoyam (taro)"],
      beans: ["frijoles"],
      corn: ["maize", "maiz"],
      "tortillas, ready-to-bake or -fry, corn": [
        "corn tortillas",
        "tortillas de maiz",
      ],
      "rice noodles": ["rice vermicelli", "bun noodles"],
    };
    for (const [prefix, values] of Object.entries(extra))
      if (lower.startsWith(prefix)) aliases.push(...values);
    foods.push({
      id: preferred?.id ?? `fdc-${record.fdcId}`,
      fdcId: record.fdcId,
      name,
      sourceDescription: record.description,
      category,
      preparation,
      source,
      sourceUrl: `https://fdc.nal.usda.gov/food-details/${record.fdcId}/nutrients`,
      per100g,
      allergens: [...detected],
      allergenReview: role === "other" || mixed ? "unverified" : "inferred",
      vegetarian,
      vegan,
      role,
      portions,
      recipeEligible: Boolean(recipeEligible),
      aliases,
    });
  }
}
const unique = [...new Map(foods.map((food) => [food.id, food])).values()];
fs.writeFileSync(
  "app/data/food-catalog.json",
  JSON.stringify({
    reviewed: "2026-10-13",
    sources,
    skippedIncomplete: skipped,
    foods: unique,
  }) + "\n",
);
console.log(
  `Imported ${unique.length} source-backed foods; excluded ${skipped} incomplete/invalid nutrient records.`,
);
