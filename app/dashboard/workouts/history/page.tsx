"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkoutHistory } from "@/app/lib/actions/workouts";
import { getActivities } from "@/app/lib/actions/activities";
import ActivityHistory from "../ActivityHistory";
import { requestJson } from "@/app/lib/http";

export default function WorkoutHistory() {
  const [logs, setLogs] = useState<
    Awaited<ReturnType<typeof getWorkoutHistory>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof getActivities>>>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([getWorkoutHistory(), requestJson<Awaited<ReturnType<typeof getActivities>>>("/api/workout-activities", { cache: "no-store" })])
      .then(([data, extra]) => {
        if (active) { setLogs(data); setActivities(extra); }
      })
      .catch(() => {
        if (active) setError("Unable to load your workout history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const sessions = new Map<string, typeof logs>();
  for (const log of logs) {
    const date = new Date(log.workoutDate).toISOString();
    sessions.set(date, [...(sessions.get(date) || []), log]);
  }
  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-6">
        <Link
          href="/dashboard/workouts"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Workouts
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Workout History</h1>
      </header>
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
      {!loading && activities.length > 0 && <section className="mb-6"><h2 className="text-xl font-semibold">Other exercises and cardio</h2><ActivityHistory activities={activities} /></section>}
      {loading ? (
        <p role="status" className="text-zinc-400">
          Loading sessions...
        </p>
      ) : !logs.length && !activities.length && !error ? (
        <p className="text-zinc-400">No sessions saved yet.</p>
      ) : (
        <div className="divide-y divide-zinc-800">
          {Array.from(sessions, ([date, sets]) => (
            <details key={date} className="py-4">
              <summary className="cursor-pointer font-medium">
                {new Date(date).toLocaleDateString()}{" "}
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {new Set(sets.map((set) => set.exerciseId)).size} exercise(s)
                  / {sets.length} {sets.length === 1 ? "set" : "sets"}
                </span>
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="pb-2">Exercise</th>
                      <th>Set</th>
                      <th>Weight (lb)</th>
                      <th>Reps</th>
                      <th>Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sets.map((set) => (
                      <tr key={set.id} className="border-t border-zinc-800">
                        <td className="py-2 pr-3">{set.exercise.name}</td>
                        <td>{set.setNumber}</td>
                        <td>{set.weight ?? "-"}</td>
                        <td>{set.reps ?? "-"}</td>
                        <td>{set.isCompleted ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
