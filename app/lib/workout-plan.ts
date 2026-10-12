import {
  femaleFocusedSessions,
  femaleSessionIndexesByDays,
  manualSessions,
  manualSessionIndexesByDays,
} from "@/app/data/starter-pack/training";

export function workoutSessions(sex: string | null, days: number | null) {
  const count = days && days >= 3 && days <= 6 ? days : 3;
  const female = sex === "female";
  const sessions = female ? femaleFocusedSessions : manualSessions;
  const indexes = (
    female ? femaleSessionIndexesByDays : manualSessionIndexesByDays
  )[count];
  return indexes.map((index) => sessions[index]);
}

export function exerciseDefaults(details: string) {
  const format = details.match(
    /(\d+)(?:-\d+)?\s*(?:sets?|rounds?)?\s*x\s*(\d+(?:-\d+)?)/i,
  );
  const suffix = format
    ? details.slice((format.index ?? 0) + format[0].length)
    : "";
  const timed = /^\s*(?:sec(?:onds?)?|secs)\b/i.test(suffix);
  return {
    sets: Number(format?.[1] ?? details.match(/(\d+)\s*sets?/i)?.[1] ?? 3),
    reps: `${format?.[2] ?? details.match(/(\d+-\d+|\d+)\s*reps?/i)?.[1] ?? "8-12"}${timed ? " sec" : ""}`,
  };
}

export function routineKey(profile: {
  sex: string | null;
  trainingDays: number | null;
  goal: string | null;
  trainingExperience: string | null;
}) {
  return [
    profile.sex,
    profile.trainingDays,
    profile.goal,
    profile.trainingExperience,
  ].join(":");
}
