"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Save, RefreshCw, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import {
  saveMeal,
  saveCalculatedMeal,
  deleteMeal,
  clearLegacyNutrition,
} from "@/app/lib/actions/meals";
import { localDate } from "@/app/lib/validation";
import { mealTotals } from "@/app/lib/tracking-summary";
import type { getNutritionDiary } from "@/app/lib/actions/meals";
import { requestJson } from "@/app/lib/http";
import MemberLoading from "@/app/components/ui/MemberLoading";
import type { MealDraft } from "@/app/lib/meal-draft";
const FoodTools = dynamic(() => import("./FoodTools"), {
  loading: () => <p role="status" className="py-8 text-zinc-400">Loading nutrition tools...</p>,
});
import MealIngredients from "./MealIngredients";

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
  const selectedDate = useRef(date);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyMeal);
  const [calculatedDraft, setCalculatedDraft] = useState<MealDraft | null>(null);
  const [calculatorReset, setCalculatorReset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [mode, setMode] = useState<"quick" | "calculator" | "pantry">("quick");
  const [toolMode, setToolMode] = useState<"calculator" | "pantry">("calculator");
  const [toolsOpened, setToolsOpened] = useState(false);
  const [toolsBusy, setToolsBusy] = useState(false);
  const composerRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const readVersion = useRef(0);

  function chooseMode(value: typeof mode) {
    setMode(value);
    if (value !== "quick") {
      setToolMode(value);
      setToolsOpened(true);
    }
  }

  function chooseDate(value: string) {
    if (!value || value === date || busy) return;
    selectedDate.current = value;
    setLoading(true);
    setDate(value);
  }
  function useMealDraft(draft: MealDraft) {
    setCalculatedDraft(draft);
    setEditingId(null);
    setForm({ name: draft.name, mealType: draft.mealType, portion: draft.portion,
      calories: String(draft.calories), protein: String(draft.protein), carbs: String(draft.carbs), fat: String(draft.fat) });
    setError(null);
    setMessage("Meal ready to review. Hit Add meal to save it to your diary.");
    openQuickEntry();
  }
  function shiftDate(offset: number) {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    chooseDate(localDate(next));
  }
  function openQuickEntry() {
    setMode("quick");
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      nameRef.current?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const version = ++readVersion.current;
    async function load() {
      setLoading(true);
      setError(null);
      setMessage(null);
      setEditingId(null);
      setForm(emptyMeal);
      setCalculatedDraft(null);
      try {
        const data = await requestJson<Diary>(`/api/nutrition?date=${date}`, { signal: controller.signal, cache: "no-store" });
        if (active && version === readVersion.current) setDiary(data);
      } catch {
        if (active && version === readVersion.current) {
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
      controller.abort();
    };
  }, [date, reload]);

  async function acceptSavedMeal(meal: Diary["meals"][number]) {
    if (selectedDate.current !== date) return;
    ++readVersion.current;
    setDiary((current) => current ? {
      ...current,
      meals: current.meals.some((entry) => entry.id === meal.id)
        ? current.meals.map((entry) => entry.id === meal.id ? meal : entry)
        : [...current.meals, meal],
    } : current);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || toolsBusy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = calculatedDraft ? await saveCalculatedMeal({ date, name: form.name, mealType: form.mealType, portions: calculatedDraft.portions }) : await saveMeal({
        ...form,
        date,
        id: editingId || undefined,
        calories: Number(form.calories),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
      });
      await acceptSavedMeal(result.meal);
      if (calculatedDraft) setCalculatorReset((value) => value + 1);
      setForm(emptyMeal);
      setCalculatedDraft(null);
      setEditingId(null);
      setMessage("Meal saved.");
    } catch {
      setError("Unable to save this meal. Check your entries and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string | null) {
    if (busy || toolsBusy || !window.confirm("Delete this food entry?")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (id) await deleteMeal(id);
      else await clearLegacyNutrition(date);
      ++readVersion.current;
      setDiary((current) => current ? {
        ...current,
        meals: id ? current.meals.filter((meal) => meal.id !== id) : current.meals,
        legacyLog: id ? current.legacyLog : null,
      } : current);
      if (id !== null && id === editingId) {
        setEditingId(null);
        setForm(emptyMeal);
        setCalculatedDraft(null);
      }
      setMessage("Entry deleted.");
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
          <p className="mt-2 text-sm text-zinc-400">Your day at a glance. Log a meal, then get on with your day.</p>
        </div>
        <div className="grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-end gap-2 sm:flex sm:w-auto">
        <button type="button" aria-label="Previous diary day" disabled={busy} onClick={() => shiftDate(-1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700"><ChevronLeft className="h-5 w-5" /></button>
        <label className="min-w-0 flex-1 text-sm text-zinc-400">
          Date
          <input
            aria-label="Food diary date"
            type="date"
            value={date}
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) {
                chooseDate(e.target.value);
              }
            }}
            className={inputClass + " [color-scheme:dark]"}
          />
        </label>
        <button type="button" aria-label="Next diary day" disabled={busy} onClick={() => shiftDate(1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700"><ChevronRight className="h-5 w-5" /></button>
        <button type="button" disabled={busy || date === localDate()} onClick={() => chooseDate(localDate())} className="col-span-3 h-11 rounded-lg border border-zinc-700 px-3 text-sm disabled:text-zinc-500">Today</button>
        </div>
      </header>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
          {!diary && (
            <button
              type="button"
              aria-label="Retry food diary"
              title="Retry food diary"
              onClick={() => setReload((value) => value + 1)}
              className="ml-3 p-2"
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
      {loading ? (
        <MemberLoading label="Loading food diary..." />
      ) : (
        diary && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                <div key={label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
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
                        {Math.round(Math.max(0, target - value))}{unit} remaining / {target}{unit} target
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
            <section className="my-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Meals <span className="text-sm font-normal text-zinc-400">({diary.meals.length})</span></h2>
                <button type="button" disabled={busy || toolsBusy} onClick={openQuickEntry} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-yellow-500 px-3 text-sm font-semibold text-black"><Plus className="h-4 w-4" />Log a meal</button>
              </div>
              {!diary.meals.length && !diary.legacyLog && (
                <div className="flex items-start gap-3 py-5 text-zinc-400"><Utensils className="mt-1 h-5 w-5 shrink-0" /><div><p>No meals logged for this day.</p><p className="mt-1 text-sm">Already know the totals? Use Add meal. Otherwise start with Meal calculator.</p></div></div>
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
                      disabled={busy || toolsBusy}
                      onClick={() => remove(null)}
                      title="Delete previous daily total"
                      aria-label="Delete previous daily total"
                      className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-red-400"
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
                      <MealIngredients value={meal.ingredients} />
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
                        disabled={busy || toolsBusy}
                        aria-label={`Edit ${meal.name}`}
                        title="Edit meal"
                        className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-white"
                        onClick={() => {
                          setEditingId(meal.id);
                          setCalculatedDraft(null);
                          setForm({
                            name: meal.name,
                            mealType: meal.mealType,
                            portion: meal.portion || "",
                            calories: String(meal.calories),
                            protein: String(meal.protein),
                            carbs: String(meal.carbs),
                            fat: String(meal.fat),
                          });
                          openQuickEntry();
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        disabled={busy || toolsBusy}
                        onClick={() => remove(meal.id)}
                        aria-label={`Delete ${meal.name}`}
                        title="Delete meal"
                        className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section ref={composerRef} className="scroll-mt-6 rounded-xl border border-zinc-800 p-4 sm:p-5" aria-label="Log food">
              <div role="tablist" aria-label="Food tools" className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-900 p-1">
                {([["quick", "Add meal"], ["calculator", "Meal calculator"], ["pantry", "Pantry ideas"]] as const).map(([value, label], index) => (
                  <button key={value} type="button" role="tab" id={`food-tab-${value}`} aria-selected={mode === value} aria-controls={value === "quick" ? "food-panel-quick" : "food-panel-tools"} tabIndex={mode === value ? 0 : -1} disabled={busy || toolsBusy}
                    onClick={() => chooseMode(value)}
                    onKeyDown={(event) => {
                      const modes = ["quick", "calculator", "pantry"] as const;
                      const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
                      if (next === null) return;
                      event.preventDefault();
                      const target = document.getElementById(`food-tab-${modes[next]}`);
                      target?.focus();
                    }}
                    className={`min-h-12 rounded-md px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${mode === value ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div id="food-panel-quick" role="tabpanel" aria-labelledby="food-tab-quick" hidden={mode !== "quick"}>
            <form
              id="meal-form"
              onSubmit={submit}
              className="min-w-0"
            >
              <h2 className="mb-4 text-xl font-semibold">
                {editingId ? "Edit meal" : "Add meal"}
              </h2>
              {!editingId && <p className="mb-4 text-sm text-zinc-400">Already tracked your meal? Enter its totals here. Otherwise, use Meal calculator or Pantry ideas to fill this form, then hit Add meal to save.</p>}
              {calculatedDraft && <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
                <p className="font-semibold text-yellow-500">Ready for your review</p>
                <ul className="mt-2 space-y-1 text-zinc-300">{calculatedDraft.portions.map((item, index) => <li key={index}>{item.grams}g {calculatedDraft.foods.find((food) => food.id === item.foodId)?.name}</li>)}</ul>
                <p className="mt-2 text-xs text-zinc-400">These totals come from the ingredients above. They are saved only when you hit Add meal.</p>
                <button type="button" disabled={busy} onClick={() => setCalculatedDraft(null)} className="mt-2 min-h-11 text-yellow-500 underline">Enter totals manually instead</button>
              </div>}
              {editingId &&
                diary.meals.find((meal) => meal.id === editingId)
                  ?.ingredients && (
                  <p className="mb-4 text-xs text-amber-400">
                    Manual changes replace the calculated ingredient breakdown.
                  </p>
                )}
              <fieldset disabled={busy || toolsBusy} className="min-w-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-zinc-400">
                    Food or meal
                    <input
                      ref={nameRef}
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
                      readOnly={Boolean(calculatedDraft)}
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
                        readOnly={Boolean(calculatedDraft)}
                        inputMode={key === "calories" ? "numeric" : "decimal"}
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
              </div>
              <div id="food-panel-tools" role="tabpanel" aria-labelledby={`food-tab-${toolMode}`} hidden={mode === "quick"}>
                {toolsOpened && <FoodTools key={date} mode={toolMode} resetToken={calculatorReset} active={mode !== "quick"} onBusyChange={setToolsBusy}
                  remainingCalories={diary.profile?.targetCalories ? diary.profile.targetCalories - totals.calories : null}
                  remainingProtein={diary.profile?.targetProtein ? diary.profile.targetProtein - totals.protein : null}
                  onUseMeal={useMealDraft} />}
              </div>
            </section>
          </>
        )
      )}
    </main>
  );
}
