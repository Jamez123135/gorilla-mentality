"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Save, ArrowRight } from "lucide-react";
import { getWorkout, saveWorkout } from "@/app/lib/actions/workouts";
import { workoutFeedback } from "@/app/lib/workout-feedback";

type SetLog = { weight: string; reps: string; completed: boolean };
type Workout = Omit<
  NonNullable<Awaited<ReturnType<typeof getWorkout>>>,
  "exercises"
> & {
  exercises: (NonNullable<
    Awaited<ReturnType<typeof getWorkout>>
  >["exercises"][number] & { entries: SetLog[] })[];
};

export default function WorkoutLogger() {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [day, setDay] = useState(0);
  const [reload, setReload] = useState(0);
  const [effort, setEffort] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutDate, setWorkoutDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<
    typeof workoutFeedback
  > | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setMessage(null);
      setFeedback(null);
      try {
        const result = await getWorkout(day);
        if (!active) return;
        setWorkout(
          result
            ? {
                ...result,
                exercises: result.exercises.map((ex) => ({
                  ...ex,
                  entries: Array.from({ length: ex.sets }, (_, index) => {
                    const saved = ex.savedSets.find(
                      (set) => set.setNumber === index + 1,
                    );
                    return {
                      weight:
                        saved?.weight !== null && saved?.weight !== undefined
                          ? String(saved.weight)
                          : "",
                      reps:
                        saved?.reps !== null && saved?.reps !== undefined
                          ? String(saved.reps)
                          : "",
                      completed: saved?.isCompleted ?? false,
                    };
                  }),
                })),
              }
            : null,
        );
        setWorkoutDate(result?.workoutDate || "");
        setEffort(result?.effort || "");
        if (result?.resumed) setMessage("Saved session resumed.");
      } catch {
        if (active) {
          setWorkout(null);
          setError("Unable to load your workout. Please refresh to try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [day, reload]);

  function updateSet(
    exIndex: number,
    setIndex: number,
    values: Partial<SetLog>,
  ) {
    setMessage(null);
    setWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((ex, i) =>
              i === exIndex
                ? {
                    ...ex,
                    entries: ex.entries.map((entry, j) =>
                      j === setIndex ? { ...entry, ...values } : entry,
                    ),
                  }
                : ex,
            ),
          }
        : null,
    );
  }

  async function save(finished = false) {
    if (!workout || saving) return;
    const sets = workout.exercises.flatMap((ex) =>
      ex.entries.flatMap((entry, i) =>
        entry.weight.trim() || entry.reps.trim()
          ? [
              {
                exerciseId: ex.id,
                weight: entry.weight.trim() ? Number(entry.weight) : null,
                reps: entry.reps.trim() ? Number(entry.reps) : null,
                setNumber: i + 1,
                isCompleted: entry.completed,
              },
            ]
          : [],
      ),
    );
    if (!sets.length) {
      setError("Enter weight or reps for at least one set.");
      return;
    }
    if (finished && !sets.some((set) => set.isCompleted)) {
      setError("Mark at least one performed set complete before finishing.");
      return;
    }
    if (
      sets.some(
        (set) =>
          (set.weight !== null &&
            (!Number.isFinite(set.weight) ||
              set.weight < 0 ||
              set.weight > 3000)) ||
          (set.reps !== null &&
            (!Number.isInteger(set.reps) || set.reps < 0 || set.reps > 1000)),
      )
    ) {
      setError(
        "Use positive weights and whole-number reps within the input limits.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveWorkout({
        workoutDate,
        sets,
        dayNumber: workout.day,
        finished,
        effort: effort || null,
      });
      setMessage(
        finished
          ? "Session finished. Your next workout is ready."
          : "Session saved.",
      );
      if (finished) {
        const repSets = sets.filter(
          (set) =>
            !workout.exercises
              .find((exercise) => exercise.id === set.exerciseId)
              ?.reps.includes("sec"),
        );
        setFeedback({
          ...workoutFeedback(
            sets,
            workout.exercises.reduce(
              (total, exercise) => total + exercise.sets,
              0,
            ),
            effort,
          ),
          volume: workoutFeedback(repSets, 0).volume,
        });
        setWorkout((current) =>
          current ? { ...current, isCompleted: true } : null,
        );
      }
    } catch {
      setError(
        "Unable to save your session. Your entries are still here; please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <p role="status" className="p-8 text-zinc-400">
        Loading workout...
      </p>
    );
  if (!workout)
    return (
      <div className="p-8">
        <p role={error ? "alert" : "status"}>
          {error || "Complete your intake to create a workout plan."}
        </p>
        <Link
          href="/starter-pack"
          className="mt-4 inline-block text-yellow-500 underline"
        >
          Starter intake
        </Link>
      </div>
    );
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <Link
        href="/dashboard/workouts/history"
        className="mb-5 inline-block text-sm text-yellow-500 underline"
      >
        Workout history
      </Link>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black break-words">{workout.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Day {workout.day} of {workout.days}
            {workout.resumed ? " / saved session" : " / next session"}
          </p>
          <label className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
            Training day
            <select
              value={day}
              disabled={saving || workout.isCompleted}
              onChange={(e) => {
                const hasEntries = workout.exercises.some((ex) =>
                  ex.entries.some((entry) => entry.weight || entry.reps),
                );
                if (
                  hasEntries &&
                  !message &&
                  !window.confirm(
                    "Discard unsaved entries and switch training days?",
                  )
                )
                  return;
                setDay(Number(e.target.value));
              }}
              className="rounded-lg bg-zinc-900 p-2 text-white border border-zinc-700"
            >
              <option value={0}>Next planned day</option>
              {Array.from({ length: workout.days }, (_, i) => (
                <option key={i} value={i + 1}>
                  Day {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          onClick={() => save()}
          disabled={saving || workout.isCompleted}
          className="flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving..." : "Save Session"}
        </button>
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
      {feedback && (
        <section className="mb-6 border-y border-zinc-800 py-5">
          <h2 className="text-xl font-semibold">Session feedback</h2>
          <p className="mt-3 text-sm text-zinc-300">
            {feedback.completed} of {feedback.planned} planned sets completed.
            Recorded weighted-rep volume: {feedback.volume.toLocaleString()}{" "}
            lb-reps.
          </p>
          <p className="mt-2 text-sm text-zinc-400">{feedback.advice}</p>
        </section>
      )}
      {workout.isCompleted && (
        <button
          type="button"
          onClick={() => {
            setDay(0);
            setReload((value) => value + 1);
          }}
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black"
        >
          Next Workout
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
      <div className="space-y-6">
        {workout.exercises.map((ex, exIndex) => (
          <section
            key={ex.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 md:p-6"
          >
            <h2 className="text-xl font-bold">{ex.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Target: {ex.progression.reps}
              {ex.reps.includes("sec") ? "" : " reps"}
              {ex.progression.weight !== null
                ? ` / ${ex.progression.weight} lb`
                : ""}
            </p>
            {ex.progression.previous && (
              <p className="mt-2 text-xs text-zinc-500">
                Last completed: {ex.progression.previous}
              </p>
            )}
            <p className="mb-4 mt-2 text-xs text-yellow-500">
              {ex.progression.reason}
            </p>
            <fieldset
              disabled={saving || workout.isCompleted}
              className="space-y-3"
            >
              <legend className="sr-only">Sets for {ex.name}</legend>
              {ex.entries.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_40px] items-center gap-2 sm:gap-4"
                >
                  <span className="text-center text-zinc-400">{i + 1}</span>
                  <input
                    aria-label={`${ex.name} set ${i + 1} weight`}
                    type="number"
                    min="0"
                    max="3000"
                    step="any"
                    placeholder={
                      ex.progression.weight !== null
                        ? `${ex.progression.weight} lb`
                        : "Weight (lb)"
                    }
                    value={entry.weight}
                    onChange={(e) =>
                      updateSet(exIndex, i, { weight: e.target.value })
                    }
                    className="min-w-0 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center"
                  />
                  <input
                    aria-label={`${ex.name} set ${i + 1} reps`}
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    placeholder={ex.reps.includes("sec") ? "Seconds" : "Reps"}
                    value={entry.reps}
                    onChange={(e) =>
                      updateSet(exIndex, i, { reps: e.target.value })
                    }
                    className="min-w-0 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center"
                  />
                  <button
                    type="button"
                    aria-label={`${ex.name} set ${i + 1} complete`}
                    aria-pressed={entry.completed}
                    title="Mark set complete"
                    onClick={() =>
                      updateSet(exIndex, i, { completed: !entry.completed })
                    }
                    className={`h-10 w-10 rounded-lg p-2 ${entry.completed ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400"}`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </fieldset>
          </section>
        ))}
      </div>
      {!workout.isCompleted && (
        <section className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-800 pt-6">
          <label className="text-sm text-zinc-400">
            Session effort
            <select
              value={effort}
              disabled={saving}
              onChange={(event) => setEffort(event.target.value)}
              className="mt-2 block rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            >
              <option value="">Choose effort (optional)</option>
              <option value="comfortable">Comfortable</option>
              <option value="challenging">Challenging</option>
              <option value="too-heavy">Too heavy</option>
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5" />
            Finish Session
          </button>
        </section>
      )}
    </main>
  );
}
