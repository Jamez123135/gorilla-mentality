"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { mealInput, nutritionInput } from "@/app/lib/validation";
import { z } from "zod";
import { sumFood } from "@/app/lib/food-types";
import { Prisma } from "@prisma/client";

export async function saveCalculatedMeal(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const data = z
    .object({
      date: z.iso.date(),
      name: z.string().trim().min(1).max(160),
      mealType: mealInput.shape.mealType,
      portions: z
        .array(
          z.object({
            foodId: z.string(),
            grams: z.number().positive().max(2000),
          }),
        )
        .min(1)
        .max(30),
    })
    .parse(input);
  const { resolveOwnedFoods } = await import("@/app/lib/owned-foods");
  const foods = await resolveOwnedFoods(
    userId,
    data.portions.map((item) => item.foodId),
  );
  const totals = sumFood(data.portions, foods);
  const portion = data.portions
    .map(
      (item) =>
        `${item.grams}g ${foods.find((food) => food.id === item.foodId)!.name}`,
    )
    .join(", ");
  const values = mealInput.parse({
    date: data.date,
    name: data.name,
    mealType: data.mealType,
    portion:
      portion.length > 120
        ? `${data.portions.length} weighed ingredients`
        : portion,
    ...totals,
  });
  const { date, ...meal } = values;
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
  const savedMeal = await prisma.mealEntry.create({
    data: {
      ...meal,
      userId,
      logDate: new Date(`${date}T00:00:00.000Z`),
      ingredients: data.portions.map((item) => ({
        grams: item.grams,
        food: foods.find((food) => food.id === item.foodId)!,
      })),
    },
  });
  return { saved: true, meal: savedMeal };
}

export async function getNutritionDiary(date: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  nutritionInput.parse({ date, calories: 0, protein: 0 });
  const logDate = new Date(`${date}T00:00:00.000Z`);
  const [profile, meals, legacyLog] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      select: { targetCalories: true, targetProtein: true },
    }),
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
  let savedMeal;
  if (id) {
    const result = await prisma.mealEntry.updateMany({
      where: { id, userId, logDate },
      data: { ...values, ingredients: Prisma.DbNull },
    });
    if (!result.count) throw new Error("Meal not found");
    savedMeal = await prisma.mealEntry.findFirstOrThrow({ where: { id, userId, logDate } });
  } else {
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    savedMeal = await prisma.mealEntry.create({ data: { ...values, userId, logDate } });
  }
  return { saved: true, meal: savedMeal };
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
