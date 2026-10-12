"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ChefHat } from "lucide-react";
import {
  calculateFood,
  foods,
  matchPantry,
  pantryIdeas,
  type FoodPortion,
} from "@/app/lib/food-calculator";
import { saveCalculatedMeal } from "@/app/lib/actions/meals";

const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
const button =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-50";
export default function FoodTools({
  date,
  remainingCalories,
  remainingProtein,
  onSave,
}: {
  date: string;
  remainingCalories: number | null;
  remainingProtein: number | null;
  onSave: () => Promise<void>;
}) {
  const [mode, setMode] = useState("calculator");
  const [portions, setPortions] = useState<FoodPortion[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [pantry, setPantry] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  let totals: ReturnType<typeof calculateFood> | null = null;
  try {
    totals = calculateFood(portions);
  } catch {
    /* Invalid or empty portions cannot be saved. */
  }
  const matches = matchPantry(pantry);
  const calorieBudget = mealCalories
    ? Number(mealCalories)
    : remainingCalories === null
      ? 500
      : Math.min(700, Math.max(0, remainingCalories / 3));
  const proteinBudget = mealProtein
    ? Number(mealProtein)
    : remainingProtein === null
      ? 30
      : Math.max(0, remainingProtein / 3);
  const ideas = pantryIdeas(
    matches.ids,
    excluded,
    Number.isFinite(calorieBudget) ? calorieBudget : 0,
    Number.isFinite(proteinBudget) ? proteinBudget : 0,
  );
  async function save() {
    if (busy || !totals) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveCalculatedMeal({ date, name, mealType, portions });
      await onSave();
      setPortions([]);
      setName("");
      setMessage("Calculated meal saved.");
    } catch {
      setError(
        "Unable to save this meal. Check the name and portions, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border-y border-zinc-800 py-6">
      <div
        role="tablist"
        aria-label="Food tools"
        className="mb-5 flex gap-4 border-b border-zinc-800"
      >
        <button
          role="tab"
          aria-selected={mode === "calculator"}
          onClick={() => setMode("calculator")}
          className={`border-b-2 py-3 text-sm font-semibold ${mode === "calculator" ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-400"}`}
        >
          Meal calculator
        </button>
        <button
          role="tab"
          aria-selected={mode === "pantry"}
          onClick={() => setMode("pantry")}
          className={`border-b-2 py-3 text-sm font-semibold ${mode === "pantry" ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-400"}`}
        >
          Pantry ideas
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-green-400">
          {message}
        </p>
      )}
      {mode === "calculator" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <h2 className="text-xl font-semibold">Meal calculator</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                Calculated meal name
                <input
                  required
                  value={name}
                  maxLength={160}
                  onChange={(event) => setName(event.target.value)}
                  className={field}
                />
              </label>
              <label className="text-sm text-zinc-400">
                Calculated meal type
                <select
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                  className={field}
                >
                  {["breakfast", "lunch", "dinner", "snack", "other"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <div className="flex items-end gap-3">
              <label className="min-w-0 flex-1 text-sm text-zinc-400">
                Food ingredient
                <select
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  className={field}
                >
                  <option value="">Choose a food</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selected || portions.length >= 20}
                title="Add ingredient"
                aria-label="Add ingredient"
                onClick={() => {
                  setPortions([...portions, { foodId: selected, grams: 100 }]);
                  setSelected("");
                }}
                className="h-11 w-11 shrink-0 rounded-lg bg-yellow-500 p-3 text-black disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {portions.map((portion, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_90px_32px] items-center gap-3 border-b border-zinc-800 pb-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm">
                    {foods.find((food) => food.id === portion.foodId)!.name}
                  </p>
                  <a
                    href={`https://fdc.nal.usda.gov/food-details/${foods.find((food) => food.id === portion.foodId)!.fdcId}/nutrients`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-zinc-500 underline"
                  >
                    USDA data
                  </a>
                </div>
                <label className="text-xs text-zinc-400">
                  Grams
                  <input
                    required
                    type="number"
                    min={1}
                    max={2000}
                    step={1}
                    aria-label={`Ingredient ${index + 1} grams`}
                    value={portion.grams || ""}
                    onChange={(event) =>
                      setPortions(
                        portions.map((item, i) =>
                          i === index
                            ? { ...item, grams: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                    className={field}
                  />
                </label>
                <button
                  type="button"
                  title="Remove ingredient"
                  aria-label={`Remove ingredient ${index + 1}`}
                  onClick={() =>
                    setPortions(portions.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            ))}
            {totals && (
              <p className="text-sm text-green-400">
                Estimated: {totals.calories} kcal / P {totals.protein}g / C{" "}
                {totals.carbs}g / F {totals.fat}g
              </p>
            )}
            <p className="text-xs leading-relaxed text-zinc-500">
              USDA SR Legacy estimates. Weights must match the listed raw or
              cooked state. Brands, sauces, and cooking oils change totals.
              Check package labels and allergens; use manual entry for foods
              outside this library.
            </p>
            <button disabled={!totals} className={button}>
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save calculated meal"}
            </button>
          </fieldset>
        </form>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Pantry ideas</h2>
          <label className="mt-4 block text-sm text-zinc-400">
            Available ingredients
            <textarea
              rows={2}
              value={pantry}
              onChange={(event) => setPantry(event.target.value)}
              placeholder="chicken, rice, broccoli"
              className={field}
            />
          </label>
          {matches.unknown.length > 0 && (
            <p className="mt-2 text-xs text-amber-400">
              Not in the food library: {matches.unknown.join(", ")}
            </p>
          )}
          <fieldset className="mt-4 flex flex-wrap gap-4">
            <legend className="mb-2 text-sm text-zinc-400">
              Exclude allergens
            </legend>
            {["milk", "egg", "fish", "soy", "wheat", "peanut"].map(
              (allergen) => (
                <label
                  key={allergen}
                  className="flex items-center gap-2 text-sm capitalize text-zinc-400"
                >
                  <input
                    type="checkbox"
                    checked={excluded.includes(allergen)}
                    onChange={(event) =>
                      setExcluded(
                        event.target.checked
                          ? [...excluded, allergen]
                          : excluded.filter((item) => item !== allergen),
                      )
                    }
                    className="accent-yellow-500"
                  />
                  {allergen}
                </label>
              ),
            )}
          </fieldset>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Meal calorie budget
              <input
                type="number"
                min={100}
                max={2000}
                value={mealCalories}
                placeholder={String(Math.round(calorieBudget))}
                onChange={(event) => setMealCalories(event.target.value)}
                className={field}
              />
            </label>
            <label className="text-sm text-zinc-400">
              Meal protein target (g)
              <input
                type="number"
                min={0}
                max={200}
                value={mealProtein}
                placeholder={String(Math.round(proteinBudget))}
                onChange={(event) => setMealProtein(event.target.value)}
                className={field}
              />
            </label>
          </div>
          {remainingCalories !== null && (
            <p className="mt-3 text-xs text-zinc-500">
              Daily calories remaining:{" "}
              {Math.max(0, Math.round(remainingCalories))} kcal. Protein
              remaining: {Math.max(0, Math.round(remainingProtein || 0))}g.
            </p>
          )}
          {!ideas.length && pantry && (
            <p className="mt-5 text-sm text-zinc-400">
              No matching ideas for these ingredients, exclusions, and calorie
              budget.
            </p>
          )}
          <div className="mt-5 divide-y divide-zinc-800">
            {ideas.map((idea) => (
              <article key={idea.name} className="py-5">
                <h3 className="font-semibold">{idea.name}</h3>
                <p className="mt-2 text-sm text-green-400">
                  Estimated: {idea.totals.calories} kcal / P{" "}
                  {idea.totals.protein}g / C {idea.totals.carbs}g / F{" "}
                  {idea.totals.fat}g
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {idea.ingredients
                    .map(
                      (item) =>
                        `${item.grams}g ${foods.find((food) => food.id === item.foodId)!.name}`,
                    )
                    .join("; ")}
                </p>
                <p className="mt-2 text-sm text-zinc-400">{idea.steps}</p>
                <p
                  className={`mt-2 text-xs ${idea.missing.length ? "text-amber-400" : "text-green-400"}`}
                >
                  {idea.missing.length
                    ? `Missing: ${idea.missing.join(", ")}`
                    : "All ingredients available"}
                  {idea.totals.calories > calorieBudget
                    ? " / Above meal calorie budget"
                    : ""}
                  {idea.totals.protein < proteinBudget
                    ? " / Below meal protein target"
                    : ""}
                </p>
                <button
                  disabled={busy}
                  onClick={() => {
                    setPortions(idea.ingredients);
                    setName(idea.name);
                    setMode("calculator");
                    setError("");
                    setMessage("");
                  }}
                  className={button + " mt-4"}
                >
                  <ChefHat className="h-4 w-4" />
                  Use meal idea
                </button>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Portions are estimates, not a medical meal plan. Check labels for
            allergens and cross-contact; oats can contain gluten. Only log food
            you actually eat. Oils and sauces are not included.
          </p>
        </div>
      )}
    </section>
  );
}
