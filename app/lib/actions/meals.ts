"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { mealInput, nutritionInput } from "@/app/lib/validation";

export async function getNutritionDiary(date: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  nutritionInput.parse({ date, calories: 0, protein: 0 });
  const logDate = new Date(`${date}T00:00:00.000Z`);
  const [profile, meals, legacyLog] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.mealEntry.findMany({
      where: { userId, logDate },
      orderBy: { createdAt: "asc" },
    }),
    prisma.nutritionLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    }),
  ]);
  return { profile, meals, legacyLog };
}

export async function saveMeal(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id, date, ...values } = mealInput.parse(input);
  const logDate = new Date(`${date}T00:00:00.000Z`);
  if (id) {
    const result = await prisma.mealEntry.updateMany({
      where: { id, userId, logDate },
      data: values,
    });
    if (!result.count) throw new Error("Meal not found");
  } else {
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    await prisma.mealEntry.create({ data: { ...values, userId, logDate } });
  }
  return { saved: true };
}

export async function deleteMeal(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const result = await prisma.mealEntry.deleteMany({ where: { id, userId } });
  if (!result.count) throw new Error("Meal not found");
  return { deleted: true };
}

export async function clearLegacyNutrition(date: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  nutritionInput.parse({ date, calories: 0, protein: 0 });
  await prisma.nutritionLog.deleteMany({
    where: { userId, logDate: new Date(`${date}T00:00:00.000Z`) },
  });
  return { deleted: true };
}
