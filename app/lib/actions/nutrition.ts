"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getNutritionData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  const today = new Date().toISOString().split('T')[0];
  const log = await prisma.nutritionLog.findUnique({
    where: {
      userId_logDate: {
        userId: userId,
        logDate: new Date(today),
      },
    },
  });

  return { profile, log };
}

export async function saveNutritionLog(calories: number, protein: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const today = new Date().toISOString().split('T')[0];

  const log = await prisma.nutritionLog.upsert({
    where: {
      userId_logDate: {
        userId: userId,
        logDate: new Date(today),
      },
    },
    update: {
      calories,
      protein,
    },
    create: {
      userId,
      logDate: new Date(today),
      calories,
      protein,
    },
  });

  return log;
}
