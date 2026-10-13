import { describe, expect, it } from "vitest";
import {
  parseNutritionLabel,
  selectedLabelValues,
} from "@/app/lib/nutrition-label";
const label = `Nutrition Facts
2 servings per container
Serving size 1 cup (55g)
Calories 220
Total Fat 7g 9%
Saturated Fat 2g 10%
Trans Fat 0g
Cholesterol 0mg 0%
Sodium 100mg 4%
Total Carbohydrate 35g 13%
Dietary Fiber 4g
Total Sugars 9g
Includes 4g Added Sugars 8%
Protein 5g
2,000 calories a day is used for general nutrition advice.`;
describe("nutrition label reading", () => {
  it("reads totals, not sub-nutrients, daily percentages or servings per container", () => {
    const result = parseNutritionLabel(label);
    expect(result.basis).toBe("serving");
    expect(result.columns).toBe(1);
    expect(selectedLabelValues(result, 0, "serving")).toEqual({
      servingGrams: 55,
      calories: 220,
      protein: 5,
      carbs: 35,
      fat: 7,
    });
  });
  it("keeps dual columns separate and does not borrow missing values from another column", () => {
    const result = parseNutritionLabel(
      `Serving size 55 g\nPer serving Per container\nCalories 220 440\nTotal Fat 7g 9% 14g 18%\nTotal Carbohydrate 35g 13% 70g 26%\nProtein 5g 10g`,
    );
    expect(result.basis).toBeNull();
    expect(result.columns).toBe(2);
    expect(selectedLabelValues(result, 1, "custom")).toEqual({
      servingGrams: null,
      calories: 440,
      protein: 10,
      carbs: 70,
      fat: 14,
    });
    const incomplete = parseNutritionLabel(
      `Calories 220\nFat 7g 14g\nProtein 5g 10g`,
    );
    expect(selectedLabelValues(incomplete, 1, "serving").calories).toBeNull();
  });
  it("recognizes per-100g French/Spanish labels and decimal commas without using kilojoules as calories", () => {
    const french = parseNutritionLabel(
      `Pour 100 g\nEnergie 1500 kJ / 360 kcal\nMatieres grasses 7,5 g\nGlucides 60 g\nProteines 10,5 g`,
    );
    expect(french.basis).toBe("100g");
    expect(selectedLabelValues(french, 0, "100g")).toEqual({
      servingGrams: 100,
      calories: 360,
      fat: 7.5,
      carbs: 60,
      protein: 10.5,
    });
    const spanish = parseNutritionLabel(
      `Por 100g\nEnergia 900kJ / 215kcal\nGrasas totales 5g\nHidratos de carbono 30g\nProteinas 8g`,
    );
    expect(selectedLabelValues(spanish, 0, "100g")).toMatchObject({
      calories: 215,
      fat: 5,
      carbs: 30,
      protein: 8,
    });
    expect(parseNutritionLabel("Energy 1500kJ").candidates.calories).toEqual(
      [],
    );
  });
  it("does not assume milliliters, ounces or the whole package equal a gram serving", () => {
    for (const size of ["250ml", "1 ounce", "0.5 cup"])
      expect(
        parseNutritionLabel(`Serving size ${size}\nCalories 220`).servingGrams,
      ).toBeNull();
    const contradictory = parseNutritionLabel(
      "Serving size 50g\nServing size 100g\nCalories 220",
    );
    expect(contradictory.servingGrams).toBeNull();
    expect(contradictory.warnings.join(" ")).toMatch(/portion weights/);
  });
  it("leaves unread, approximate and malformed values blank rather than inventing zeroes", () => {
    const result = parseNutritionLabel(
      "Serving size 55g\nCalories 220 11%\nTotal Fat <1g\nProtein Og\nTotal Carbohydrate 1.2.3g",
    );
    const values = selectedLabelValues(result, 0, "serving");
    expect(values).toMatchObject({
      calories: 220,
      fat: null,
      protein: null,
      carbs: null,
    });
    expect(result.candidates.calories).toHaveLength(1);
    expect(parseNutritionLabel("Protein 0g").candidates.protein[0].value).toBe(
      0,
    );
  });
  it("handles wrapped rows, bilingual names and calorie-from-fat exclusions", () => {
    const result = parseNutritionLabel(
      "Serving size (55 g)\nCalories\n220\nCalories from fat 60\nFat / Lipides 7g\nCarbohydrate / Glucides 35g\nProtein / Proteines 5g",
    );
    expect(selectedLabelValues(result, 0, "serving")).toMatchObject({
      calories: 220,
      fat: 7,
      carbs: 35,
      protein: 5,
    });
  });
  it("bounds text and flags as-prepared or uncertain label bases", () => {
    expect(
      parseNutritionLabel("As prepared\nCalories 200\nFat 5g").basis,
    ).toBeNull();
    expect(
      parseNutritionLabel("unreadable ".repeat(10000)).candidates.protein,
    ).toEqual([]);
  });
});
