import { describe, expect, it } from "vitest";
import {
  catalogFoods,
  catalogCount,
  officialFood,
  searchCatalog,
  resolvePantry,
} from "@/app/lib/food-catalog";
import {
  buildPantryIdeas,
  fitPortions,
  allowedFood,
} from "@/app/lib/pantry-planner";
import { sumFood, type PantryOptions } from "@/app/lib/food-types";
import { labelFoodInput } from "@/app/lib/food-input";

const options: PantryOptions = {
  diet: "any",
  excluded: [],
  calories: 500,
  protein: 35,
  onlyAvailable: true,
};
const food = (id: string) => officialFood(id)!;
const label = {
  name: "Example garri label",
  brand: "",
  reference: "Package nutrition label",
  servingGrams: 50,
  calories: 180,
  protein: 1,
  carbs: 43,
  fat: 0.5,
  preparation: "dry",
  role: "starch",
  diet: "vegan",
  allergens: [],
  labelReviewed: true,
};

describe("international source-backed food library", () => {
  it("contains complete, traceable macro records and both USDA datasets", () => {
    expect(catalogCount).toBe(8104);
    expect(new Set(catalogFoods.map((item) => item.id)).size).toBe(
      catalogCount,
    );
    expect(new Set(catalogFoods.map((item) => item.source)).size).toBe(2);
    for (const item of catalogFoods) {
      expect(item.sourceUrl).toContain(`/food-details/${item.fdcId}/`);
      expect(
        Object.values(item.per100g).every(
          (value) => Number.isFinite(value) && value >= 0,
        ),
      ).toBe(true);
    }
  });
  for (const term of [
    "tortilla",
    "pinto",
    "plantain",
    "yam",
    "yuca",
    "gungo",
    "moong",
    "soba",
    "tofu",
    "teff",
    "quinoa",
    "avocado",
    "aubergine",
    "groundnuts",
    "maize",
  ])
    it(`finds international pantry term: ${term}`, () => {
      expect(searchCatalog(term).length).toBeGreaterThan(0);
    });
  it("requires confirmation instead of guessing ambiguous preparations or unfamiliar names", () => {
    const result = resolvePantry(
      "plantain, beans, soysauce, totallyunknownfoodxyz",
    );
    expect(result.foods).toEqual([]);
    expect(result.ambiguous.map((item) => item.token)).toContain("plantain");
    expect(result.ambiguous.map((item) => item.token)).toContain("beans");
    expect(result.unknown).toContain("totallyunknownfoodxyz");
    expect(resolvePantry("garri, egusi").foods).toEqual([]);
    expect(resolvePantry("beans, Beans").ambiguous.length).toBe(1);
    expect(() => resolvePantry(Array(51).fill("rice").join(","))).toThrow(/50/);
  });
  it("does not equate raw and cooked food weights", () => {
    const dryRice = catalogFoods.find(
      (item) =>
        item.category === "Cereal Grains and Pasta" &&
        /rice, white, long-grain/.test(item.name.toLowerCase()) &&
        /raw|uncooked/.test(item.preparation),
    )!;
    expect(dryRice).toBeTruthy();
    expect(
      sumFood([{ foodId: dryRice.id, grams: 100 }], [dryRice]).calories,
    ).toBeGreaterThan(300);
    expect(
      sumFood([{ foodId: "rice", grams: 100 }], [food("rice")]).calories,
    ).toBe(130);
    expect(searchCatalog("rice").length).toBeLessThanOrEqual(40);
    expect(searchCatalog("rice")[0]).not.toHaveProperty("aliases");
  });
  it("matches all query words and puts familiar exact foods ahead of unrelated prepared products", () => {
    expect(searchCatalog("brown rice")[0].id).toBe("fdc-169704");
    expect(searchCatalog("canned chickpeas")[0].name).toMatch(
      /chickpeas.*canned/i,
    );
    expect(searchCatalog("flour tortilla")[0].name).toMatch(
      /flour tortilla|tortill.*flour/i,
    );
    expect(searchCatalog("rice noodles")[0].name).toMatch(/rice noodles/i);
  });
  it("avoids false egg and dairy tags on eggplant and plant/nut products", () => {
    expect(food("fdc-169228").allergens).not.toContain("egg");
    for (const id of ["fdc-170173", "peanut-butter"])
      expect(food(id).allergens).not.toContain("milk");
    expect(food("peanut-butter").allergens).toContain("peanut");
    expect(food("fdc-170686").allergens).not.toContain("wheat");
    expect(food("fdc-170686").allergens).not.toContain("gluten");
  });
  it("keeps condiments and baking ingredients out of meal-base optimization", () => {
    for (const id of ["fdc-172473", "fdc-2512377"])
      expect(food(id).recipeEligible).toBe(false);
    expect(food("fdc-169985").recipeEligible).toBe(false); // Raw cassava is not ready to eat.
    expect(food("tofu").recipeEligible).toBe(true);
    for (const item of catalogFoods.filter(
      (item) =>
        item.role === "protein" &&
        item.vegetarian === false &&
        item.recipeEligible,
    ))
      expect(
        item.preparation === "cooked" || item.preparation.startsWith("canned"),
      ).toBe(true);
  });
  it("uses conservative dietary/allergen filtering for animal and uncertain mixed foods", () => {
    expect(
      allowedFood(food("chicken"), { ...options, diet: "vegetarian" }),
    ).toBe(false);
    expect(allowedFood(food("yogurt"), { ...options, diet: "vegan" })).toBe(
      false,
    );
    expect(allowedFood(food("tofu"), { ...options, excluded: ["soy"] })).toBe(
      false,
    );
    const soba = food("fdc-168907");
    expect(soba.allergenReview).toBe("unverified");
    expect(allowedFood(soba, { ...options, excluded: ["wheat"] })).toBe(false);
    const vegan = buildPantryIdeas(
      [food("lentils"), food("rice"), food("broccoli"), food("chicken")],
      [],
      { ...options, diet: "vegan" },
    );
    expect(vegan.length).toBeGreaterThan(0);
    expect(
      vegan.every((idea) => idea.foods.every((item) => item.vegan === true)),
    ).toBe(true);
  });
});

describe("bounded meal ideas and label validation", () => {
  it("counts oils, respects available-only mode and recalculates all displayed totals", () => {
    const available = [
      food("chicken"),
      food("rice"),
      food("broccoli"),
      food("oil"),
    ];
    const ideas = buildPantryIdeas(available, [food("banana")], options);
    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.missing).toEqual([]);
      expect(idea.ingredients.some((item) => item.foodId === "oil")).toBe(true);
      expect(idea.totals).toEqual(sumFood(idea.ingredients, idea.foods));
      expect(
        idea.ingredients.every((item) => item.grams > 0 && item.grams <= 350),
      ).toBe(true);
      expect(
        idea.ingredients.every((item) =>
          available.some((record) => record.id === item.foodId),
        ),
      ).toBe(true);
    }
  });
  it("exposes impossible protein and optional macro limits instead of promising a fit", () => {
    const result = fitPortions([food("rice"), food("broccoli")], {
      ...options,
      calories: 100,
      protein: 150,
      carbsMax: 0,
      fatMax: 0,
    });
    expect(result.gaps).toContain("Below protein target");
    expect(result.gaps).toContain("Above carbohydrate limit");
    expect(result.gaps).toContain("Above fat limit");
    expect(
      buildPantryIdeas([food("rice")], [], { ...options, protein: NaN }),
    ).toEqual([]);
  });
  it("validates per-serving mass and explicit diet declarations without inventing missing nutrients", () => {
    expect(labelFoodInput.safeParse(label).success).toBe(true);
    for (const invalid of [
      { ...label, servingGrams: 0 },
      { ...label, carbs: 100 },
      { ...label, calories: NaN },
      { ...label, protein: undefined },
      { ...label, allergens: ["milk"] },
    ])
      expect(labelFoodInput.safeParse(invalid).success).toBe(false);
  });
});
