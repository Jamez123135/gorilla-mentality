import {
  femaleFocusedSessions, femaleSessionIndexesByDays,
  manualSessions, manualSessionIndexesByDays,
} from "@/app/data/starter-pack/training";

export function workoutSessions(sex: string | null, days: number | null) {
  const count = days && days >= 3 && days <= 6 ? days : 3;
  const female = sex === "female";
  const sessions = female ? femaleFocusedSessions : manualSessions;
  const indexes = (female ? femaleSessionIndexesByDays : manualSessionIndexesByDays)[count];
  return indexes.map(index => sessions[index]);
}

export function exerciseDefaults(details: string) {
  return {
    sets: Number(details.match(/(\d+)\s*sets?/i)?.[1] ?? 3),
    reps: details.match(/(\d+-\d+|\d+)\s*reps?/i)?.[1] ?? "8-12",
  };
}
