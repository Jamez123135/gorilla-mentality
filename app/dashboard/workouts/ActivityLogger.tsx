"use client";
import { useEffect, useRef, useState } from "react";
import { Dumbbell, HeartPulse, Plus, X } from "lucide-react";
import { saveActivity, getActivities, deleteActivity } from "@/app/lib/actions/activities";
import { localDate } from "@/app/lib/validation";
import { requestJson } from "@/app/lib/http";
import ActivityHistory from "./ActivityHistory";
import ExerciseReference from "./ExerciseReference";

const field = "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-white";
export default function ActivityLogger() {
  const [kind, setKind] = useState<"strength" | "cardio" | null>(null);
  const [date, setDate] = useState(localDate);
  const [names, setNames] = useState({ strength: "", cardio: "" });
  const name = kind ? names[kind] : "";
  function setName(value: string) {
    if (kind) setNames((current) => ({ ...current, [kind]: value }));
  }
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [sets, setSets] = useState([{ weight: "", reps: "" }]);
  const [minutes, setMinutes] = useState("");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");
  const [notes, setNotes] = useState("");
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof getActivities>>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const draftIds = useRef<{ strength: string | null; cardio: string | null }>({ strength: null, cardio: null });
  const readVersion = useRef(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const version = ++readVersion.current;
    requestJson<Awaited<ReturnType<typeof getActivities>>>("/api/workout-activities", { signal: controller.signal, cache: "no-store" }).then((data) => { if (active && version === readVersion.current) { setActivities(data); setError(""); } })
      .catch(() => { if (active && version === readVersion.current) setError("Unable to load your activities. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reload]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || loading || !kind) return;
    setBusy(true); setError(""); setMessage("");
    draftIds.current[kind] ??= crypto.randomUUID();
    const common = { id: draftIds.current[kind], date, name, notes };
    try {
      const activity = await saveActivity(kind === "strength"
        ? { ...common, kind, unit, sets: sets.map((set) => ({ weight: set.weight.trim() ? Number(set.weight) : null, reps: Number(set.reps) })) }
        : { ...common, kind, minutes: Number(minutes), distance: distance.trim() ? Number(distance) : null, distanceUnit });
      ++readVersion.current;
      setActivities((current) => [activity, ...current.filter((item) => item.id !== activity.id)]);
      draftIds.current[kind] = null;
      setName(""); setSets([{ weight: "", reps: "" }]); setMinutes(""); setDistance(""); setNotes("");
      setMessage(kind === "cardio" ? "Cardio saved." : "Exercise saved.");
    } catch { ++readVersion.current; setError("Unable to save this activity. Check the date, name and numbers, then try again. Your entries are still here."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm("Delete this activity?")) return;
    setBusy(true); setError("");
    try { await deleteActivity(id); ++readVersion.current; setActivities((current) => current.filter((item) => item.id !== id)); setMessage("Activity deleted."); }
    catch { ++readVersion.current; setError("Unable to delete this activity. Please retry."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Other workouts and cardio" className="mb-7 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
    <h2 className="text-xl font-semibold">What else did you do?</h2>
    <p className="mt-2 text-sm text-zinc-400">Log any exercise or cardio, even when it isn&apos;t in your plan.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={busy} aria-pressed={kind === "strength"} onClick={() => { setKind("strength"); setMessage(""); }} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${kind === "strength" ? "border-yellow-500 text-yellow-500" : "border-zinc-700"}`}><Dumbbell className="h-4 w-4" />Log another exercise</button>
      <button type="button" disabled={busy} aria-pressed={kind === "cardio"} onClick={() => { setKind("cardio"); setMessage(""); }} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${kind === "cardio" ? "border-yellow-500 text-yellow-500" : "border-zinc-700"}`}><HeartPulse className="h-4 w-4" />Log cardio</button>
      {kind && <button type="button" disabled={busy} aria-label="Close activity form" onClick={() => setKind(null)} className="ml-auto flex h-11 w-11 items-center justify-center"><X className="h-4 w-4" /></button>}
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}{loading || !activities.length ? <button type="button" onClick={() => setReload((value) => value + 1)} className="ml-2 min-h-11 underline">Retry activities</button> : null}</p>}
    {message && <p role="status" className="mt-4 text-green-400">{message}</p>}
    {kind && <form onSubmit={submit} className="mt-5"><fieldset disabled={busy || loading} className="min-w-0 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">Activity date<input aria-label="Activity date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={field + " [color-scheme:dark]"} /></label>
        <label className="text-sm text-zinc-400">{kind === "strength" ? "Exercise name" : "Cardio activity"}<input aria-label={kind === "strength" ? "Exercise name" : "Cardio activity"} required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === "strength" ? "e.g. Dumbbell bench press" : "e.g. Running, cycling, swimming"} className={field} /></label>
      </div>
      {kind === "strength" ? <>
        <ExerciseReference name={name} />
        <label className="block text-sm text-zinc-400">Weight unit<select aria-label="Activity weight unit" value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)} className={field}><option value="lb">Pounds (lb)</option><option value="kg">Kilograms (kg)</option></select></label>
        <p className="text-xs text-zinc-400">Enter each set you performed. Leave weight empty for bodyweight exercises.</p>
        {sets.map((set, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-end gap-2">
          <label className="text-xs text-zinc-400">Set {index + 1} weight<input aria-label={`Activity set ${index + 1} weight`} type="number" inputMode="decimal" min={0} max={1500} step="any" value={set.weight} onChange={(event) => setSets((current) => current.map((item, i) => i === index ? { ...item, weight: event.target.value } : item))} className={field} placeholder={unit} /></label>
          <label className="text-xs text-zinc-400">Reps<input aria-label={`Activity set ${index + 1} reps`} type="number" inputMode="numeric" required min={1} max={1000} step={1} value={set.reps} onChange={(event) => setSets((current) => current.map((item, i) => i === index ? { ...item, reps: event.target.value } : item))} className={field} /></label>
          <button type="button" disabled={sets.length === 1} aria-label={`Remove activity set ${index + 1}`} onClick={() => setSets((current) => current.filter((_, i) => i !== index))} className="flex h-11 w-11 items-center justify-center disabled:opacity-30"><X className="h-4 w-4" /></button>
        </div>)}
        <button type="button" disabled={sets.length >= 30} onClick={() => setSets((current) => [...current, { weight: "", reps: "" }])} className="inline-flex min-h-11 items-center gap-2 text-sm text-yellow-500"><Plus className="h-4 w-4" />Add performed set</button>
      </> : <>
        <ExerciseReference name={name} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-zinc-400">Duration (minutes)<input aria-label="Cardio duration (minutes)" type="number" inputMode="decimal" required min={0.1} max={1440} step="any" value={minutes} onChange={(event) => setMinutes(event.target.value)} className={field} /></label>
          <label className="text-sm text-zinc-400">Distance (optional)<input aria-label="Cardio distance" type="number" inputMode="decimal" min={0.01} max={1000} step="any" value={distance} onChange={(event) => setDistance(event.target.value)} className={field} /></label>
          <label className="text-sm text-zinc-400">Distance unit<select aria-label="Cardio distance unit" value={distanceUnit} onChange={(event) => setDistanceUnit(event.target.value as typeof distanceUnit)} className={field}><option value="km">Kilometres</option><option value="mi">Miles</option></select></label>
        </div>
      </>}
      <label className="block text-sm text-zinc-400">Notes (optional)<textarea aria-label="Activity notes" rows={2} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} className={field} /></label>
      <button type="submit" className="min-h-11 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? "Saving activity..." : kind === "cardio" ? "Save cardio" : "Save exercise"}</button>
    </fieldset></form>}
    <details className="mt-4"><summary className="cursor-pointer py-2 text-sm text-zinc-300">Your additional activities ({activities.length})</summary>
      {loading ? <p role="status" className="py-3 text-sm text-zinc-400">Loading activities...</p> : !activities.length ? <p className="py-3 text-sm text-zinc-400">No additional activities yet.</p> : <ActivityHistory activities={activities} onDelete={remove} busy={busy} />}
    </details>
  </section>;
}
