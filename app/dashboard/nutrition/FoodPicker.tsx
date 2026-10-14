"use client";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { requestJson } from "@/app/lib/http";
import type { FoodSummary } from "@/app/lib/food-types";

export default function FoodPicker({ label, categories, disabled, onPick }: {
  label: string; categories: string[]; disabled?: boolean; onPick: (food: FoodSummary) => void;
}) {
  const pantry = label === "Pantry ingredient";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<FoodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query, category });
        const rows = await requestJson<FoodSummary[]>("/api/foods/search?" + params, { signal: controller.signal, cache: "no-store" });
        if (active) setResults(rows);
      } catch {
        if (active) setError("Food search unavailable. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [query, category, retry]);
  const field = "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white";
  return (
    <section aria-label={pantry ? "Choose pantry foods" : "Choose meal foods"} className="space-y-3">
      <label className="block text-sm text-zinc-300">
        <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" />{pantry ? "Find a pantry food" : "Find a food"}</span>
        <input type="search" aria-label={pantry ? "Find a pantry food" : "Find a food"} autoComplete="off" maxLength={160} disabled={disabled} value={query}
          onChange={(event) => { setResults([]); setLoading(true); setExpanded(false); setQuery(event.target.value); }}
          placeholder="Try chicken, cooked rice, or a brand name" className={field} />
      </label>
      <details>
        <summary className="cursor-pointer py-2 text-sm text-zinc-400">Filter by food group</summary>
        <label className="block text-sm text-zinc-400">Food group
          <select aria-label={label + " category"} value={category} disabled={disabled}
            onChange={(event) => { setResults([]); setLoading(true); setExpanded(false); setCategory(event.target.value); }} className={field}>
            <option value="">All categories</option><option>Personal label foods</option>
            {categories.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </details>
      <p role="status" className="text-xs text-zinc-400">{loading ? "Finding foods..." : error ? "" : query ? results.length + " matches. Tap the food you ate to add it." : "Popular foods. Tap one to add it, or type a name above."}</p>
      {error && <p role="alert" className="text-sm text-red-400">{error}<button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-3 min-h-11 underline">Retry food search</button></p>}
      {!loading && !error && query && !results.length && <p className="text-sm text-zinc-400">No verified match. A personal label entry can cover this food.</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {results.slice(0, expanded ? 40 : 6).map((food) => <li key={food.id}>
          <button type="button" data-testid={"pick-" + (pantry ? "pantry" : "meal") + "-" + food.id} aria-label={"Add " + food.name + " to " + (pantry ? "pantry" : "meal")} disabled={disabled || loading} onClick={() => onPick(food)}
            className="flex h-full w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-left transition-colors hover:border-yellow-500 disabled:opacity-50">
            <span className="min-w-0"><span className="block break-words text-sm font-medium">{food.name}</span><span className="mt-1 block text-xs text-zinc-400">{food.preparation} / {Math.round(food.per100g.calories)} kcal per 100g</span></span>
            <Plus className="h-5 w-5 shrink-0 text-yellow-500" />
          </button>
        </li>)}
      </ul>
      {results.length > 6 && <button type="button" onClick={() => setExpanded(!expanded)} className="min-h-11 text-sm text-yellow-500 underline">{expanded ? "Show fewer foods" : "Show all " + results.length + " matches"}</button>}
    </section>
  );
}
