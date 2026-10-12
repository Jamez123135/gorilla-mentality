type PerformedSet = {
  weight: number | null;
  reps: number | null;
  isCompleted: boolean;
};
export function workoutFeedback(
  sets: PerformedSet[],
  plannedSets: number,
  effort?: string | null,
) {
  const completed = sets.filter((set) => set.isCompleted);
  const volume = completed.reduce(
    (sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0),
    0,
  );
  const advice =
    effort === "too-heavy"
      ? "Reduce the load on your next matching session. Keep reps controlled and stop if you feel pain."
      : completed.length < plannedSets
        ? "Partial session recorded. Keep the current load and work toward consistent sets before adding weight."
        : "Full session recorded. Follow your next-session targets and prioritize recovery before training these muscles again.";
  return {
    completed: completed.length,
    planned: plannedSets,
    volume: Math.round(volume),
    advice,
  };
}
