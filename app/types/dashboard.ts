import type { Profile } from "@prisma/client";

export type DashboardProfile = Pick<Profile, "fullName" | "goal" | "targetCalories" | "targetProtein" | "sex" | "trainingDays">;
export type ProgressPhoto = { id: string; url: string; createdAt: string; label: string | null };
