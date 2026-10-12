"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  getWeightHistory,
  saveWeight,
  deleteWeight,
} from "@/app/lib/actions/weight";
import { localDate } from "@/app/lib/validation";

export function WeightTracker() {
  const [entries, setEntries] = useState<
    Awaited<ReturnType<typeof getWeightHistory>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(localDate);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getWeightHistory()
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch(() => {
        if (active) setError("Unable to load weight history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const displayWeight = (lb: number) =>
    Math.round((unit === "kg" ? lb / 2.20462 : lb) * 10) / 10;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveWeight({ date, weight: Number(weight), unit });
      setEntries(await getWeightHistory());
      setWeight("");
      setMessage("Weight saved.");
    } catch {
      setError("Unable to save your weight. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this weight entry?")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await deleteWeight(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
      setMessage("Entry deleted.");
    } catch {
      setError("Unable to delete this entry.");
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-1 min-w-0 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white [color-scheme:dark]";
  const change =
    entries.length > 1
      ? displayWeight(entries[0].weightLb) -
        displayWeight(entries[entries.length - 1].weightLb)
      : null;
  return (
    <section className="mb-10 border-y border-zinc-800 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Body Weight</h2>
        {change !== null && (
          <p className="text-sm text-zinc-400">
            Change: {change > 0 ? "+" : ""}
            {Math.round(change * 10) / 10} {unit}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-green-400">
          {message}
        </p>
      )}
      <form onSubmit={submit} className="mt-4">
        <fieldset
          disabled={busy}
          className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-[1.2fr_1fr_80px_auto] sm:items-end"
        >
          <label className="text-sm text-zinc-400">
            Date
            <input
              aria-label="Weight date"
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm text-zinc-400">
            Weight
            <input
              aria-label="Body weight"
              type="number"
              min="1"
              max="2000"
              step="0.1"
              value={weight}
              required
              onChange={(e) => setWeight(e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm text-zinc-400">
            Unit
            <select
              aria-label="Weight unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
              className={input}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black">
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Save weight"}
          </button>
        </fieldset>
      </form>
      {loading ? (
        <p role="status" className="mt-4 text-zinc-400">
          Loading weight history...
        </p>
      ) : !entries.length ? (
        <p className="mt-4 text-sm text-zinc-400">No weight entries yet.</p>
      ) : (
        <div className="mt-5 max-h-72 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Weight</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-zinc-800">
                  <td className="py-2">
                    {new Date(entry.logDate).toISOString().slice(0, 10)}
                  </td>
                  <td>
                    {displayWeight(entry.weightLb)} {unit}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      disabled={busy}
                      aria-label={`Delete weight on ${new Date(entry.logDate).toISOString().slice(0, 10)}`}
                      title="Delete entry"
                      className="p-2 text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
