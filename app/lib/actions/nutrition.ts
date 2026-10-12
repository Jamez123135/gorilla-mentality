"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { nutritionInput } from "@/app/lib/validation";

export async function getNutritionData(
  date = new Date().toISOString().slice(0, 10),
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  const parsed = nutritionInput.safeParse({ calories: 0, protein: 0, date });
  if (!parsed.success) throw new Error("Invalid log date");
  const log = await prisma.nutritionLog.findUnique({
    where: {
      userId_logDate: {
        userId: userId,
        logDate: new Date(`${date}T00:00:00.000Z`),
      },
    },
  });

  return { profile, log };
}

export async function saveNutritionLog(
  calories: number,
  protein: number,
  date = new Date().toISOString().slice(0, 10),
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = nutritionInput.safeParse({ calories, protein, date });
  if (!parsed.success) throw new Error("Check your nutrition entries");
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new Error("Complete your intake first");
  const logDate = new Date(`${date}T00:00:00.000Z`);

  const log = await prisma.nutritionLog.upsert({
    where: {
      userId_logDate: {
        userId: userId,
        logDate,
      },
    },
    update: {
      calories,
      protein,
    },
    create: {
      userId,
      logDate,
      calories,
      protein,
    },
  });

  return log;
}
