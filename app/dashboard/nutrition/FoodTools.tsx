"use client";
import { useEffect, useState, useRef } from "react";
import { Save, Trash2, ChefHat, Plus, RefreshCw } from "lucide-react";
import {
  sumFood,
  allergens,
  type FoodSummary,
  type FoodPortion,
} from "@/app/lib/food-types";
import {
  getFoodToolsState,
  getPantrySuggestions,
  savePantry,
  deleteLabelFood,
} from "@/app/lib/actions/food-tools";
import { saveCalculatedMeal } from "@/app/lib/actions/meals";
import FoodPicker from "./FoodPicker";
import LabelFoodForm from "./LabelFoodForm";
import { mealInput } from "@/app/lib/validation";
type State = Awaited<ReturnType<typeof getFoodToolsState>>;
type Suggestions = Awaited<ReturnType<typeof getPantrySuggestions>>;
const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
const command =
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
  const toolsRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<State | null>(null);
  const [mode, setMode] = useState("calculator");
  const [showLabel, setShowLabel] = useState(false);
  const [portions, setPortions] = useState<FoodPortion[]>([]);
  const [records, setRecords] = useState<FoodSummary[]>([]);
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [text, setText] = useState("");
  const [pantry, setPantry] = useState<FoodSummary[]>([]);
  const [diet, setDiet] = useState<"any" | "vegetarian" | "vegan">("any");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [mealsRemaining, setMealsRemaining] = useState(3);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [suggestionResult, setSuggestions] = useState<
    (Suggestions & { requestKey: string }) | null
  >(null);
  const [finding, setFinding] = useState(false);
  const [reload, setReload] = useState(0);
  const [actionBusy, setBusy] = useState(false);
  const [labelSaving, setLabelSaving] = useState(false);
  const busy = actionBusy || labelSaving;
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    getFoodToolsState()
      .then((data) => {
        if (active) {
          setState(data);
          setError("");
          setPantry(data.pantry);
          setDiet(data.preferences.diet);
          setExcluded(data.preferences.excluded);
          setOnlyAvailable(data.preferences.onlyAvailable);
          setMealsRemaining(data.preferences.mealsRemaining);
          setCalories(data.preferences.calories?.toString() ?? "");
          setProtein(data.preferences.protein?.toString() ?? "");
          setCarbs(data.preferences.carbsMax?.toString() ?? "");
          setFat(data.preferences.fatMax?.toString() ?? "");
        }
      })
      .catch(() => {
        if (active) setError("Unable to load nutrition tools. Please retry.");
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const calorieBudget = calories
    ? Number(calories)
    : remainingCalories !== null && remainingCalories >= 100
      ? Math.min(700, Math.max(100, remainingCalories / mealsRemaining))
      : 500;
  const proteinBudget = protein
    ? Number(protein)
    : remainingProtein === null
      ? 30
      : Math.min(200, Math.max(0, remainingProtein / mealsRemaining));
  const idsKey = pantry.map((food) => food.id).join("|");
  const allergensKey = excluded.join("|");
  const requestKey = JSON.stringify([
    text,
    idsKey,
    diet,
    allergensKey,
    onlyAvailable,
    calorieBudget,
    proteinBudget,
    carbs,
    fat,
  ]);
  const suggestions =
    suggestionResult?.requestKey === requestKey ? suggestionResult : null;
  useEffect(() => {
    if (mode !== "pantry") return;
    let active = true;
    if (!text.trim() && !idsKey) {
      setTimeout(() => {
        if (active) {
          setSuggestions(null);
          setFinding(false);
        }
      }, 0);
      return () => {
        active = false;
      };
    }
    const timer = setTimeout(async () => {
      setFinding(true);
      try {
        const data = await getPantrySuggestions({
          text,
          ids: idsKey ? idsKey.split("|") : [],
          diet,
          excluded: allergensKey ? allergensKey.split("|") : [],
          onlyAvailable,
          calories: calorieBudget,
          protein: proteinBudget,
          ...(carbs ? { carbsMax: Number(carbs) } : {}),
          ...(fat ? { fatMax: Number(fat) } : {}),
        });
        if (active) {
          setSuggestions({ ...data, requestKey });
          setError("");
        }
      } catch (error) {
        if (active) {
          setSuggestions(null);
          setError(
            error instanceof Error
              ? error.message
              : "Unable to find meal ideas.",
          );
        }
      } finally {
        if (active) setFinding(false);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    mode,
    text,
    idsKey,
    diet,
    allergensKey,
    onlyAvailable,
    calorieBudget,
    proteinBudget,
    carbs,
    fat,
    requestKey,
  ]);
  let totals: ReturnType<typeof sumFood> | null = null;
  try {
    totals = sumFood(portions, records);
  } catch {
    /* Empty or invalid ingredient amounts cannot be saved. */
  }
  const validTotals =
    totals &&
    mealInput
      .omit({ name: true, date: true, id: true, mealType: true, portion: true })
      .safeParse(totals).success;
  function addFood(food: FoodSummary) {
    setRecords((current) => [
      ...new Map([...current, food].map((food) => [food.id, food])).values(),
    ]);
    setPortions((current) => [
      ...current,
      {
        foodId: food.id,
        grams: food.id.startsWith("custom:")
          ? (food.portions[0]?.grams ?? 100)
          : 100,
      },
    ]);
  }
  function addPantry(food: FoodSummary) {
    setPantry((current) => [
      ...new Map([...current, food].map((food) => [food.id, food])).values(),
    ]);
  }
  async function action(callback: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callback();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to complete this action.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      ref={toolsRef}
      className="scroll-mt-4 border-y border-zinc-800 py-6 [overflow-wrap:anywhere]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {state
            ? `${state.count.toLocaleString()} source-backed foods + your personal labels`
            : "Loading food library..."}
        </p>
        <button
          type="button"
          disabled={busy || !state}
          onClick={() => setShowLabel(!showLabel)}
          className="inline-flex items-center gap-2 text-sm text-yellow-500"
        >
          <Plus className="h-4 w-4" />
          Add label food
        </button>
      </div>
      <div
        role="tablist"
        aria-label="Food tools"
        className="mb-5 flex gap-4 border-b border-zinc-800"
      >
        {[
          ["calculator", "Meal calculator"],
          ["pantry", "Pantry ideas"],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            disabled={busy}
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError("");
              setMessage("");
            }}
            className={`border-b-2 py-3 text-sm font-semibold ${mode === value ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}{" "}
          {!state && (
            <button
              title="Retry nutrition tools"
              aria-label="Retry nutrition tools"
              onClick={() => setReload((value) => value + 1)}
              className="ml-3"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-green-400">
          {message}
        </p>
      )}
      {showLabel && (
        <LabelFoodForm
          onBusyChange={setLabelSaving}
          onClose={() => setShowLabel(false)}
          onSaved={(food) => {
            setState((current) =>
              current
                ? {
                    ...current,
                    personalFoods: [...current.personalFoods, food],
                  }
                : current,
            );
            if (mode === "pantry") addPantry(food);
            else {
              addFood(food);
              setName((current) => current || food.name.slice(0, 160));
            }
            setMessage("Personal label food saved.");
          }}
        />
      )}
      {mode === "calculator" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (validTotals)
              action(async () => {
                await saveCalculatedMeal({ date, name, mealType, portions });
                await onSave();
                setPortions([]);
                setName("");
                setMessage("Calculated meal saved.");
              });
          }}
        >
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <h2 className="text-xl font-semibold">Meal calculator</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                Calculated meal name
                <input
                  required
                  maxLength={160}
                  value={name}
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
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <FoodPicker
              key={state?.personalFoods.length ?? 0}
              label="Food ingredient"
              categories={state?.categories ?? []}
              disabled={busy || portions.length >= 30}
              onPick={addFood}
            />
            {portions.map((portion, index) => {
              const food = records.find((food) => food.id === portion.foodId)!;
              const invalidWeight =
                !Number.isFinite(portion.grams) ||
                portion.grams <= 0 ||
                portion.grams > 2000;
              return (
                <div key={index} className="border-b border-zinc-800 pb-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_80px_44px] items-center gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm">{food.name}</p>
                      <p className="mt-1 text-xs text-amber-400">
                        {food.preparation}
                      </p>
                      {food.sourceUrl ? (
                        <a
                          href={food.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-500 underline"
                        >
                          {food.source}
                        </a>
                      ) : (
                        <p className="text-xs text-zinc-500">{food.source}</p>
                      )}
                    </div>
                    <label className="text-xs text-zinc-400">
                      Grams
                      <input
                        required
                        type="number"
                        min={0}
                        max={2000}
                        step="any"
                        aria-label={`Ingredient ${index + 1} grams`}
                        aria-invalid={invalidWeight}
                        aria-describedby={
                          invalidWeight
                            ? `ingredient-${index}-error`
                            : undefined
                        }
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
                      aria-label={`Remove ingredient ${index + 1}`}
                      title="Remove ingredient"
                      className="flex h-11 w-11 items-center justify-center"
                      onClick={() =>
                        setPortions(portions.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                  {invalidWeight && (
                    <p
                      id={`ingredient-${index}-error`}
                      className="mt-2 text-xs text-red-400"
                    >
                      Enter a weight above 0 and up to 2,000g.
                    </p>
                  )}
                  <label className="mt-3 block text-xs text-zinc-400">
                    Ingredient {index + 1} measure
                    <select
                      value=""
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (value > 0)
                          setPortions(
                            portions.map((item, i) =>
                              i === index ? { ...item, grams: value } : item,
                            ),
                          );
                      }}
                      className={field}
                    >
                      <option value="">
                        Gram weight / choose a source measure
                      </option>
                      <option value="28.349523125">1 oz (28.35g)</option>
                      {food.portions.map((measure, i) => (
                        <option key={i} value={measure.grams}>
                          {measure.label} ({measure.grams}g)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
            {totals && (
              <p className="text-sm text-green-400">
                Estimated: {totals.calories} kcal / P {totals.protein}g / C{" "}
                {totals.carbs}g / F {totals.fat}g
              </p>
            )}
            {totals && !validTotals && (
              <p role="alert" className="text-sm text-amber-400">
                This meal exceeds the diary&apos;s per-meal limits. Reduce the
                portions or record separate meals.
              </p>
            )}
            <p className="text-xs leading-relaxed text-zinc-500">
              Use edible gram weights in the listed preparation state. Raw, dry,
              cooked, drained, and branded foods are not interchangeable. Source
              values and labels are estimates; include oils, sauces and extras.
            </p>
            <button disabled={!validTotals} className={command}>
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save calculated meal"}
            </button>
          </fieldset>
        </form>
      ) : (
        <fieldset disabled={busy || !state} className="min-w-0 space-y-5">
          <h2 className="text-xl font-semibold">Pantry ideas</h2>
          <label className="block text-sm text-zinc-400">
            Available ingredients
            <textarea
              aria-label="Available ingredients"
              rows={2}
              maxLength={2000}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="chicken, rice, broccoli"
              className={field}
            />
          </label>
          <FoodPicker
            key={state?.personalFoods.length ?? 0}
            label="Pantry ingredient"
            categories={state?.categories ?? []}
            disabled={busy || pantry.length >= 100}
            onPick={addPantry}
          />
          {pantry.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-800">
              {pantry.map((food) => (
                <li
                  key={food.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <p className="min-w-0 break-words text-sm">
                    {food.name}
                    <span className="block text-xs text-zinc-500">
                      {food.preparation}
                    </span>
                  </p>
                  <button
                    title="Remove pantry ingredient"
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    aria-label={`Remove ${food.name} from pantry`}
                    onClick={() =>
                      setPantry(pantry.filter((item) => item.id !== food.id))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-zinc-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Diet preference
              <select
                value={diet}
                onChange={(event) => setDiet(event.target.value as typeof diet)}
                className={field}
              >
                <option value="any">Any diet</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </label>
            <label className="text-sm text-zinc-400">
              Meals remaining today
              <input
                type="number"
                min={1}
                max={6}
                value={mealsRemaining}
                onChange={(event) =>
                  setMealsRemaining(
                    Math.max(1, Math.min(6, Number(event.target.value))),
                  )
                }
                className={field}
              />
            </label>
          </div>
          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-2 text-sm text-zinc-400">
              Exclude allergens / gluten
            </legend>
            {allergens.map((allergen) => (
              <label
                key={allergen}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <input
                  type="checkbox"
                  checked={excluded.includes(allergen)}
                  onChange={(event) =>
                    setExcluded(
                      event.target.checked
                        ? [...excluded, allergen]
                        : excluded.filter((value) => value !== allergen),
                    )
                  }
                  className="accent-yellow-500"
                />
                {allergen}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(event) => setOnlyAvailable(event.target.checked)}
              className="accent-yellow-500"
            />
            Only use my available ingredients
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                "Meal calorie budget",
                calories,
                setCalories,
                Math.round(calorieBudget),
                100,
                2000,
              ],
              [
                "Meal protein target (g)",
                protein,
                setProtein,
                Math.round(proteinBudget),
                0,
                200,
              ],
              ["Carbohydrate limit (g, optional)", carbs, setCarbs, "", 0, 400],
              ["Fat limit (g, optional)", fat, setFat, "", 0, 150],
            ].map(([label, value, setValue, placeholder, min, max]) => (
              <label key={String(label)} className="text-sm text-zinc-400">
                {String(label)}
                <input
                  type="number"
                  step="any"
                  min={Number(min)}
                  max={Number(max)}
                  value={String(value)}
                  placeholder={String(placeholder)}
                  onChange={(event) =>
                    (setValue as (value: string) => void)(event.target.value)
                  }
                  className={field}
                />
              </label>
            ))}
          </div>
          {remainingCalories !== null && (
            <p className="text-xs text-zinc-500">
              Daily target comparison:{" "}
              {Math.max(0, Math.round(remainingCalories))} kcal and{" "}
              {Math.max(0, Math.round(remainingProtein ?? 0))}g protein
              remaining.
              {remainingCalories < 100
                ? " Your target is nearly met; the idea budget is still editable and logging remains available."
                : ""}
            </p>
          )}
          <button
            disabled={busy || !state}
            onClick={() =>
              action(async () => {
                const resolved = await getPantrySuggestions({
                  text,
                  ids: pantry.map((food) => food.id),
                  diet,
                  excluded,
                  onlyAvailable,
                  calories: calorieBudget,
                  protein: proteinBudget,
                  ...(carbs ? { carbsMax: Number(carbs) } : {}),
                  ...(fat ? { fatMax: Number(fat) } : {}),
                });
                if (resolved.unknown.length || resolved.ambiguous.length)
                  throw new Error(
                    "Confirm or remove unresolved ingredients before saving your pantry.",
                  );
                const items = resolved.matched;
                await savePantry({
                  ids: items.map((food) => food.id),
                  preferences: {
                    diet,
                    excluded,
                    onlyAvailable,
                    mealsRemaining,
                    ...(calories ? { calories: Number(calories) } : {}),
                    ...(protein ? { protein: Number(protein) } : {}),
                    ...(carbs ? { carbsMax: Number(carbs) } : {}),
                    ...(fat ? { fatMax: Number(fat) } : {}),
                  },
                });
                setPantry(items);
                setText("");
                setMessage("Pantry and preferences saved.");
              })
            }
            className={command}
          >
            <Save className="h-4 w-4" />
            Save pantry
          </button>
          {finding && (
            <p role="status" className="text-sm text-zinc-400">
              Finding meal ideas...
            </p>
          )}
          {suggestions?.matched.length ? (
            <p className="text-xs text-zinc-400">
              Matched: {suggestions.matched.map((food) => food.name).join("; ")}
            </p>
          ) : null}
          {suggestions?.ambiguous.map((entry) => (
            <div key={entry.token} className="border-l-2 border-amber-400 pl-4">
              <label className="block text-sm text-amber-400">
                Confirm food and preparation for: {entry.token}
                <select
                  value=""
                  onChange={(event) => {
                    const food = entry.options.find(
                      (food) => food.id === event.target.value,
                    );
                    if (food) {
                      addPantry(food);
                      setText(
                        text
                          .split(/[,;\n]/)
                          .filter((token) => token.trim() !== entry.token)
                          .join(", "),
                      );
                    }
                  }}
                  className={field}
                >
                  <option value="">Choose a confirmed match</option>
                  {entry.options.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          {suggestions?.unknown.length ? (
            <p className="text-sm text-amber-400">
              No verified match: {suggestions.unknown.join(", ")}. A personal
              label entry can cover missing foods.
            </p>
          ) : null}
          {suggestions?.unsuitable.length ? (
            <p className="text-xs text-amber-400">
              No automatic meal assembly for these preparation states or mixed
              foods: {suggestions.unsuitable.join("; ")}. They remain available
              in the meal calculator.
            </p>
          ) : null}
          {suggestions && !suggestions.ideas.length && !finding && (
            <p className="text-sm text-zinc-400">
              No meal ideas fit the selected ingredients and restrictions.
              Review preparation states or adjust the selections.
            </p>
          )}
          <div className="divide-y divide-zinc-800">
            {suggestions?.ideas.map((idea) => (
              <article key={idea.name} className="py-5">
                <h3 className="break-words font-semibold">{idea.name}</h3>
                <p className="mt-2 text-sm text-green-400">
                  Estimated: {idea.totals.calories} kcal / P{" "}
                  {idea.totals.protein}g / C {idea.totals.carbs}g / F{" "}
                  {idea.totals.fat}g
                </p>
                <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                  {idea.ingredients.map((portion, index) => (
                    <li key={index} className="break-words">
                      {portion.grams}g{" "}
                      {
                        idea.foods.find((food) => food.id === portion.foodId)!
                          .name
                      }
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {idea.steps}
                </p>
                <p
                  className={`mt-3 text-xs ${idea.missing.length || idea.gaps.length ? "text-amber-400" : "text-green-400"}`}
                >
                  {idea.missing.length
                    ? `Missing: ${idea.missing.join(", ")}`
                    : "All ingredients available"}
                  {idea.gaps.length
                    ? ` / ${idea.gaps.join(" / ")}`
                    : " / Meets the selected macro limits"}
                </p>
                {idea.warnings.map((warning) => (
                  <p key={warning} className="mt-2 text-xs text-amber-400">
                    {warning}
                  </p>
                ))}
                <button
                  disabled={busy}
                  onClick={() => {
                    setRecords(idea.foods);
                    setPortions(idea.ingredients);
                    setName(idea.name.slice(0, 160));
                    setMode("calculator");
                    setError("");
                    setMessage("");
                    requestAnimationFrame(() =>
                      toolsRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      }),
                    );
                  }}
                  className={command + " mt-4"}
                >
                  <ChefHat className="h-4 w-4" />
                  Use meal idea
                </button>
              </article>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Suggestions are bounded ingredient combinations, not medically
            personalized meal plans. A protein target or macro limit may be
            infeasible; gaps remain visible. Generic allergen tags cannot verify
            brands or cross-contact. Check labels and seek qualified guidance
            for medical dietary needs.
          </p>
        </fieldset>
      )}
      {!!state?.personalFoods.length && (
        <details className="mt-6 border-t border-zinc-800 pt-4">
          <summary className="cursor-pointer text-sm text-zinc-400">
            My label foods ({state.personalFoods.length})
          </summary>
          <ul className="mt-3 divide-y divide-zinc-800">
            {state.personalFoods.map((food) => (
              <li key={food.id} className="flex justify-between gap-3 py-3">
                <span className="min-w-0 break-words text-sm">{food.name}</span>
                <button
                  title="Delete label food"
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  aria-label={`Delete label food ${food.name}`}
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this label food? Saved meal totals will remain unchanged.",
                      )
                    )
                      action(async () => {
                        await deleteLabelFood(food.id);
                        setState((current) =>
                          current
                            ? {
                                ...current,
                                personalFoods: current.personalFoods.filter(
                                  (item) => item.id !== food.id,
                                ),
                              }
                            : current,
                        );
                        setPantry((current) =>
                          current.filter((item) => item.id !== food.id),
                        );
                        setPortions((current) =>
                          current.filter((item) => item.foodId !== food.id),
                        );
                        setMessage(
                          "Label food deleted. Meal history retained.",
                        );
                      });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-zinc-400" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
