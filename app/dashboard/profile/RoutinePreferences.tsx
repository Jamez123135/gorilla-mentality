"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import {
  getRoutinePreferences,
  saveRoutinePreferences,
} from "@/app/lib/actions/routine";
import {
  muscleLabels,
  musclePriorities,
  type MusclePriority,
} from "@/app/lib/muscle-priority";

export default function RoutinePreferences() {
  const [form, setForm] = useState({
    musclePriority: "balanced",
    trainingDays: 3,
    trainingExperience: "new",
  });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getRoutinePreferences()
      .then((profile) => {
        if (!active) return;
        if (profile?.sex && profile.trainingDays) {
          setForm({
            musclePriority: profile.musclePriority || "balanced",
            trainingDays: profile.trainingDays,
            trainingExperience: profile.trainingExperience || "new",
          });
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setError("Unable to load routine preferences.");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="mb-8 max-w-2xl border-y border-zinc-800 py-6">
      <h2 className="mb-4 text-xl font-semibold">Training preferences</h2>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-green-400">
          {message}{" "}
          <Link href="/dashboard/workouts" className="underline">
            View routine
          </Link>
        </p>
      )}
      {ready && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            try {
              await saveRoutinePreferences(form);
              setMessage("Routine updated. Your workout history is preserved.");
            } catch {
              setError("Unable to update your routine. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset
            disabled={busy}
            className="grid min-w-0 gap-4 sm:grid-cols-3"
          >
            <label className="text-sm text-zinc-400">
              Muscle priority
              <select
                aria-label="Muscle priority"
                value={form.musclePriority}
                onChange={(event) =>
                  setForm({ ...form, musclePriority: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
              >
                {musclePriorities.map((value: MusclePriority) => (
                  <option value={value} key={value}>
                    {muscleLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-400">
              Training days
              <select
                value={form.trainingDays}
                onChange={(event) =>
                  setForm({ ...form, trainingDays: Number(event.target.value) })
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
              >
                {[3, 4, 5, 6].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-400">
              Experience
              <select
                value={form.trainingExperience}
                onChange={(event) =>
                  setForm({ ...form, trainingExperience: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
              >
                <option value="new">New</option>
                <option value="returning">Returning</option>
                <option value="consistent">Consistent</option>
              </select>
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 p-3 font-bold text-black sm:col-span-3">
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save training preferences"}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
