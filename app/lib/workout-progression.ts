type LoggedSet = {
  weight: number | null;
  reps: number | null;
  setNumber: number;
  workoutDate: Date | string;
  isCompleted: boolean;
};
type Effort = string | null | undefined;

export function getProgression(
  reps: string,
  plannedSets: number,
  logs: LoggedSet[],
  effort?: Effort,
) {
  const baseline = {
    weight: null as number | null,
    reps,
    reason: "Choose your starting load and build a performance history.",
    previous: null as string | null,
  };
  if (reps.includes("sec"))
    return {
      ...baseline,
      reason: "Keep the prescribed hold time and controlled form.",
    };
  const sessions = new Map<string, LoggedSet[]>();
  for (const log of logs) {
    if (!log.isCompleted || log.reps === null) continue;
    const date = new Date(log.workoutDate).toISOString();
    sessions.set(date, [...(sessions.get(date) || []), log]);
  }
  const history = Array.from(sessions.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, sets]) => sets);
  if (!history.length) return baseline;
  const latest = history[0];
  const range = reps.match(/(\d+)(?:-(\d+))?/);
  const lower = Number(range?.[1] || 8);
  const upper = Number(range?.[2] || lower);
  const load = latest[0].weight;
  const uniformLoad = latest.every((set) => set.weight === load);
  const minimum = Math.min(...latest.map((set) => set.reps ?? 0));
  const previous = `${load === null || load === 0 ? "Bodyweight" : `${load} lb`} / ${minimum} reps`;
  const base = {
    weight: uniformLoad ? load : null,
    reps,
    reason: "Repeat your last load and build controlled reps.",
    previous,
  };
  if (effort === "too-heavy" && load && uniformLoad) {
    return {
      ...base,
      weight: Math.round(load * 0.95 * 10) / 10,
      reason:
        "You marked the last session too heavy. Try a lighter working load.",
    };
  }
  const ready =
    history.slice(0, 2).length === 2 &&
    history
      .slice(0, 2)
      .every(
        (sets) =>
          sets.length >= plannedSets &&
          sets.every(
            (set) =>
              set.reps !== null && set.reps > upper && set.weight === load,
          ),
      );
  if (ready && load && uniformLoad) {
    const nextLoad = Math.ceil((load * 1.025) / 2.5) * 2.5;
    const increase = (nextLoad - load) / load;
    if (increase >= 0.02 && increase <= 0.1)
      return {
        ...base,
        weight: nextLoad,
        reason:
          "Two completed sessions above your rep range. A small load increase is ready.",
      };
  }
  if (
    latest.length >= plannedSets &&
    uniformLoad &&
    minimum >= lower &&
    minimum <= upper
  ) {
    return {
      ...base,
      reps: String(minimum + 1),
      reason: "Keep the load and aim for one more controlled rep per set.",
    };
  }
  return base;
}

export function nextTrainingDay(
  lastCompletedDay: number | undefined,
  days: number,
) {
  return lastCompletedDay && lastCompletedDay >= 1 && lastCompletedDay <= days
    ? (lastCompletedDay % days) + 1
    : 1;
}
