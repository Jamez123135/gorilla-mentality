"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { nutritionInput } from "@/app/lib/validation";
import { mealTotals } from "@/app/lib/tracking-summary";
import { z } from "zod";

export async function getDashboard(
  date: string,
  weekStart: string,
  weekEnd: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  nutritionInput.parse({ date, calories: 0, protein: 0 });
  z.iso.datetime().parse(weekStart);
  z.iso.datetime().parse(weekEnd);
  const logDate = new Date(`${date}T00:00:00.000Z`);
  const [profile, meals, legacy, sessions, weight] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.mealEntry.findMany({ where: { userId, logDate } }),
    prisma.nutritionLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    }),
    prisma.workoutSession.count({
      where: {
        userId,
        isCompleted: true,
        workoutDate: { gte: new Date(weekStart), lt: new Date(weekEnd) },
      },
    }),
    prisma.weightEntry.findFirst({
      where: { userId },
      orderBy: { logDate: "desc" },
    }),
  ]);
  return {
    profile,
    totals: mealTotals(meals, legacy),
    mealCount: meals.length,
    workoutsThisWeek: sessions,
    latestWeight: weight?.weightLb ?? null,
  };
}
