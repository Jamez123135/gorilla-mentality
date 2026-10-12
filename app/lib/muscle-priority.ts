import type { TrainingSession } from "@/app/types/starter-pack";

export const musclePriorities = [
  "balanced",
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
] as const;
export type MusclePriority = (typeof musclePriorities)[number];
export const muscleLabels: Record<MusclePriority, string> = {
  balanced: "Balanced / full body",
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  glutes: "Glutes",
  core: "Core",
};
const focus: Record<
  Exclude<MusclePriority, "balanced">,
  { name: string; details: string }
> = {
  chest: { name: "Chest fly", details: "2 x 10-12, controlled reps" },
  back: { name: "Lat pulldowns", details: "2 x 8-12, controlled reps" },
  shoulders: {
    name: "Dumbbell lateral raises",
    details: "2 x 12-15, controlled reps",
  },
  arms: { name: "Hammer curls", details: "2 x 10-12, controlled reps" },
  legs: { name: "Leg curl", details: "2 x 10-12, controlled reps" },
  glutes: { name: "Glute bridge", details: "2 x 10-12, controlled reps" },
  core: { name: "Dead bug", details: "2 x 8-12, each side" },
};

export function prioritizeMuscle(
  sessions: TrainingSession[],
  priority?: string | null,
) {
  if (
    !priority ||
    priority === "balanced" ||
    !musclePriorities.includes(priority as MusclePriority)
  )
    return sessions;
  const key = priority as Exclude<MusclePriority, "balanced">;
  const accessory = focus[key];
  // Two small focus slots per split; keep the base movements and other muscle groups.
  return sessions.map((session, index) => {
    if (index !== 0 && index !== 2) return session;
    const existing = session.exercises.find(
      (exercise) => exercise.name === accessory.name,
    );
    return {
      ...session,
      title: `${session.title} / ${muscleLabels[key]} priority`,
      intent: `${session.intent} Extra emphasis: ${muscleLabels[key].toLowerCase()}.`,
      exercises: existing
        ? [
            existing,
            ...session.exercises.filter((exercise) => exercise !== existing),
          ]
        : [...session.exercises, accessory],
    };
  });
}
