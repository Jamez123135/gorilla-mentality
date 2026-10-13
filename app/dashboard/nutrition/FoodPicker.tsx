"use client";
import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { searchFoods } from "@/app/lib/actions/food-tools";
import type { FoodSummary } from "@/app/lib/food-types";
const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
export default function FoodPicker({
  label,
  categories,
  disabled,
  onPick,
}: {
  label: string;
  categories: string[];
  disabled?: boolean;
  onPick: (food: FoodSummary) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<FoodSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          const rows = await searchFoods(query, category);
          if (active) {
            setResults(rows);
            setSelected("");
          }
        } catch {
          if (active) {
            setResults([]);
            setSelected("");
            setError("Food search unavailable. Please try again.");
          }
        } finally {
          if (active) setLoading(false);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category, retry]);
  const food = results.find((food) => food.id === selected);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search {label.toLowerCase()}s
          </span>
          <input
            value={query}
            disabled={disabled}
            maxLength={160}
            onChange={(event) => {
              setSelected("");
              setResults([]);
              setLoading(true);
              setQuery(event.target.value);
            }}
            placeholder="Food, preparation, or brand"
            className={field}
          />
        </label>
        <label className="text-sm text-zinc-400">
          {label} category
          <select
            aria-label={`${label} category`}
            value={category}
            disabled={disabled}
            onChange={(event) => {
              setSelected("");
              setResults([]);
              setLoading(true);
              setCategory(event.target.value);
            }}
            className={field}
          >
            <option value="">All categories</option>
            <option>Personal label foods</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-end gap-3">
        <label className="min-w-0 flex-1 text-sm text-zinc-400">
          {label}
          <select
            aria-label={label}
            value={selected}
            disabled={disabled || loading}
            onChange={(event) => setSelected(event.target.value)}
            className={field}
          >
            <option value="">
              {loading ? "Searching..." : "Choose a food"}
            </option>
            {results.map((food) => (
              <option value={food.id} key={food.id}>
                {food.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label={
            label === "Food ingredient"
              ? "Add ingredient"
              : "Add pantry ingredient"
          }
          title="Add selected food"
          disabled={!food || disabled || loading}
          onClick={() => {
            if (food) {
              onPick(food);
              setSelected("");
            }
          }}
          className="h-11 w-11 shrink-0 rounded-lg bg-yellow-500 p-3 text-black disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
          <button
            type="button"
            title="Retry food search"
            aria-label="Retry food search"
            onClick={() => setRetry((value) => value + 1)}
            className="ml-3"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </p>
      )}
      {!loading && !error && query && !results.length && (
        <p className="text-sm text-zinc-400">
          No verified match. A personal label entry can cover this food.
        </p>
      )}
      {food && (
        <p className="break-words text-xs leading-relaxed text-zinc-400">
          <span className="mb-1 block font-medium text-white">{food.name}</span>
          {food.preparation} / per 100g: {Math.round(food.per100g.calories)}{" "}
          kcal, P {Math.round(food.per100g.protein * 10) / 10}g, C{" "}
          {Math.round(food.per100g.carbs * 10) / 10}g, F{" "}
          {Math.round(food.per100g.fat * 10) / 10}
          g. {food.source}.
        </p>
      )}
    </div>
  );
}
