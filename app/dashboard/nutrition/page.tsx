"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import {
  getNutritionDiary,
  saveMeal,
  deleteMeal,
  clearLegacyNutrition,
} from "@/app/lib/actions/meals";
import { localDate } from "@/app/lib/validation";
import { mealTotals } from "@/app/lib/tracking-summary";
import FoodTools from "./FoodTools";

type Diary = Awaited<ReturnType<typeof getNutritionDiary>>;
const emptyMeal = {
  name: "",
  mealType: "breakfast",
  portion: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};
const inputClass =
  "mt-1 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-yellow-500";

export default function NutritionTracker() {
  const [date, setDate] = useState(localDate);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyMeal);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setMessage(null);
      setEditingId(null);
      setForm(emptyMeal);
      try {
        const data = await getNutritionDiary(date);
        if (active) setDiary(data);
      } catch {
        if (active) {
          setDiary(null);
          setError("Unable to load your food diary. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [date]);

  async function refresh() {
    setDiary(await getNutritionDiary(date));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveMeal({
        ...form,
        date,
        id: editingId || undefined,
        calories: Number(form.calories),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
      });
      setForm(emptyMeal);
      setEditingId(null);
      setMessage("Meal saved.");
      await refresh();
    } catch {
      setError("Unable to save this meal. Check your entries and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string | null) {
    if (busy || !window.confirm("Delete this food entry?")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (id) await deleteMeal(id);
      else await clearLegacyNutrition(date);
      if (id === editingId) {
        setEditingId(null);
        setForm(emptyMeal);
      }
      setMessage("Entry deleted.");
      await refresh();
    } catch {
      setError("Unable to delete this entry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const totals = mealTotals(diary?.meals || [], diary?.legacyLog);
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-yellow-500">
            Free Member Tools
          </p>
          <h1 className="mt-2 text-3xl font-bold">Food Diary</h1>
        </div>
        <label className="text-sm text-zinc-400">
          Date
          <input
            aria-label="Food diary date"
            type="date"
            value={date}
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
            className={inputClass + " [color-scheme:dark]"}
          />
        </label>
      </header>
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
      {loading ? (
        <p role="status" className="text-zinc-400">
          Loading food diary...
        </p>
      ) : (
        diary && (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-zinc-800 py-6 sm:grid-cols-4">
              {(
                [
                  [
                    "Calories",
                    totals.calories,
                    diary.profile?.targetCalories,
                    "kcal",
                  ],
                  [
                    "Protein",
                    totals.protein,
                    diary.profile?.targetProtein,
                    "g",
                  ],
                  ["Carbs", totals.carbs, null, "g"],
                  ["Fat", totals.fat, null, "g"],
                ] as const
              ).map(([label, value, target, unit]) => (
                <div key={label}>
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="mt-2 text-2xl font-bold">
                    {Math.round(value * 10) / 10}
                    <span className="ml-1 text-sm font-normal text-zinc-400">
                      {unit}
                    </span>
                  </p>
                  {target ? (
                    <>
                      <p className="mt-1 text-xs text-zinc-400">
                        Target {target}
                        {unit}
                      </p>
                      <progress
                        aria-label={`${label} target progress`}
                        max={target}
                        value={Math.min(value, target)}
                        className="mt-2 h-2 w-full accent-yellow-500"
                      />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
            {!diary.profile?.targetCalories && (
              <p className="mt-4 text-sm text-zinc-400">
                <Link
                  href="/starter-pack"
                  className="text-yellow-500 underline"
                >
                  Set your nutrition targets
                </Link>
              </p>
            )}
            <FoodTools
              key={date}
              date={date}
              remainingCalories={
                diary.profile?.targetCalories
                  ? diary.profile.targetCalories - totals.calories
                  : null
              }
              remainingProtein={
                diary.profile?.targetProtein
                  ? diary.profile.targetProtein - totals.protein
                  : null
              }
              onSave={refresh}
            />
            <section className="py-7">
              <h2 className="mb-4 text-xl font-semibold">Meals</h2>
              {!diary.meals.length && !diary.legacyLog && (
                <p className="text-zinc-400">No meals logged for this day.</p>
              )}
              <ul className="divide-y divide-zinc-800">
                {diary.legacyLog && (
                  <li className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">
                        Previously logged daily total
                      </p>
                      <p className="text-sm text-zinc-400">
                        {diary.legacyLog.calories || 0} kcal ·{" "}
                        {diary.legacyLog.protein || 0}g protein
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => remove(null)}
                      title="Delete previous daily total"
                      aria-label="Delete previous daily total"
                      className="p-2 text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )}
                {diary.meals.map((meal) => (
                  <li
                    key={meal.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs capitalize text-zinc-500">
                        {meal.mealType}
                      </p>
                      <p className="break-words font-medium">{meal.name}</p>
                      {meal.portion && (
                        <p className="break-words text-sm text-zinc-400">
                          {meal.portion}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-zinc-400">
                        {meal.calories} kcal · P {meal.protein}g · C{" "}
                        {meal.carbs}g · F {meal.fat}g
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        disabled={busy}
                        aria-label={`Edit ${meal.name}`}
                        title="Edit meal"
                        className="p-2 text-zinc-400 hover:text-white"
                        onClick={() => {
                          setEditingId(meal.id);
                          setForm({
                            name: meal.name,
                            mealType: meal.mealType,
                            portion: meal.portion || "",
                            calories: String(meal.calories),
                            protein: String(meal.protein),
                            carbs: String(meal.carbs),
                            fat: String(meal.fat),
                          });
                          document.getElementById("meal-form")?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => remove(meal.id)}
                        aria-label={`Delete ${meal.name}`}
                        title="Delete meal"
                        className="p-2 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <form
              id="meal-form"
              onSubmit={submit}
              className="border-t border-zinc-800 pt-6"
            >
              <h2 className="mb-4 text-xl font-semibold">
                {editingId ? "Edit meal" : "Add meal"}
              </h2>
              <fieldset disabled={busy} className="min-w-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-zinc-400">
                    Food or meal
                    <input
                      required
                      maxLength={160}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Chicken, rice and vegetables"
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm text-zinc-400">
                    Meal
                    <select
                      value={form.mealType}
                      onChange={(e) =>
                        setForm({ ...form, mealType: e.target.value })
                      }
                      className={inputClass}
                    >
                      {["breakfast", "lunch", "dinner", "snack", "other"].map(
                        (type) => (
                          <option key={type} value={type}>
                            {type[0].toUpperCase() + type.slice(1)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-400 sm:col-span-2">
                    Portion
                    <input
                      maxLength={120}
                      value={form.portion}
                      onChange={(e) =>
                        setForm({ ...form, portion: e.target.value })
                      }
                      placeholder="1 bowl, 200 g, or 2 servings"
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {(
                    [
                      ["calories", "Calories", 10000],
                      ["protein", "Protein (g)", 1000],
                      ["carbs", "Carbs (g)", 2000],
                      ["fat", "Fat (g)", 1000],
                    ] as const
                  ).map(([key, label, max]) => (
                    <label key={key} className="text-sm text-zinc-400">
                      {label}
                      <input
                        type="number"
                        required={key === "calories"}
                        min="0"
                        max={max}
                        step={key === "calories" ? "1" : "0.1"}
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        placeholder="0"
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50"
                    disabled={busy}
                  >
                    {editingId ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {busy
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Add meal"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyMeal);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          </>
        )
      )}
    </main>
  );
}
