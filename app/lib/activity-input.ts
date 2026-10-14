import { z } from "zod";
const base = {
  id: z.string().uuid(),
  date: z.iso.date(),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).default(""),
};
export const activityInput = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("strength"), unit: z.enum(["lb", "kg"]),
    sets: z.array(z.object({ weight: z.number().min(0).max(1500).nullable(), reps: z.number().int().min(1).max(1000) })).min(1).max(30),
  }),
  z.object({ ...base, kind: z.literal("cardio"), minutes: z.number().positive().max(1440),
    distance: z.number().positive().max(1000).nullable().default(null), distanceUnit: z.enum(["km", "mi"]),
  }),
]);
export const recordedSets = z.array(z.object({ weightLb: z.number().nullable(), reps: z.number().int() }));
