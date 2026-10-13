"use server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import {
  catalogCount,
  catalogCategories,
  searchCatalog,
  resolvePantry,
  officialFood,
} from "@/app/lib/food-catalog";
import { labelFood, resolveOwnedFoods } from "@/app/lib/owned-foods";
import {
  labelFoodInput,
  pantryPreferencesInput,
  suggestionInput,
  foodIdInput,
} from "@/app/lib/food-input";
import { buildPantryIdeas } from "@/app/lib/pantry-planner";
async function member() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
export async function getFoodToolsState() {
  const userId = await member();
  const rows = await prisma.customFood.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    take: 200,
  });
  const pantry = await prisma.memberPantry.findUnique({ where: { userId } });
  const preferences = pantryPreferencesInput.safeParse(
    pantry?.preferences ?? {},
  );
  const validIds = (pantry?.foodIds ?? []).filter((id) =>
    id.startsWith("custom:")
      ? rows.some((row) => id === `custom:${row.id}`)
      : Boolean(officialFood(id)),
  );
  return {
    count: catalogCount,
    categories: catalogCategories,
    personalFoods: rows.map(labelFood),
    pantry: await resolveOwnedFoods(userId, validIds),
    preferences: preferences.success
      ? preferences.data
      : pantryPreferencesInput.parse({}),
  };
}
export async function searchFoods(query: string, category = "") {
  const userId = await member();
  const text = z.string().max(160).parse(query);
  z.string().max(100).parse(category);
  const personal =
    category && category !== "Personal label foods"
      ? []
      : await prisma.customFood.findMany({
          where: {
            userId,
            ...(text
              ? {
                  OR: [
                    { name: { contains: text, mode: "insensitive" } },
                    { brand: { contains: text, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          take: 20,
          orderBy: { name: "asc" },
        });
  return [
    ...personal.map(labelFood),
    ...(category === "Personal label foods"
      ? []
      : searchCatalog(text, category)),
  ].slice(0, 40);
}
export async function saveLabelFood(input: unknown) {
  const userId = await member();
  const parsed = labelFoodInput.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Check the food name, gram serving weight, label values and diet/allergen declarations.",
    );
  const { servingGrams, ...data } = parsed.data;
  const factor = 100 / servingGrams;
  return prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: { updatedAt: new Date() },
    });
    if ((await tx.customFood.count({ where: { userId } })) >= 200)
      throw new Error(
        "Your personal food library is full. Remove an unused entry first.",
      );
    return labelFood(
      await tx.customFood.create({
        data: {
          ...data,
          userId,
          calories: data.calories * factor,
          protein: data.protein * factor,
          carbs: data.carbs * factor,
          fat: data.fat * factor,
          allergens: [...new Set(data.allergens)],
        },
      }),
    );
  });
}
export async function deleteLabelFood(id: string) {
  const userId = await member();
  const key = z
    .string()
    .uuid()
    .parse(id.replace(/^custom:/, ""));
  await prisma.$transaction(async (tx) => {
    const result = await tx.customFood.deleteMany({
      where: { id: key, userId },
    });
    if (!result.count) throw new Error("Food not found");
    const pantry = await tx.memberPantry.findUnique({ where: { userId } });
    if (pantry)
      await tx.memberPantry.update({
        where: { userId },
        data: {
          foodIds: pantry.foodIds.filter(
            (foodId) => foodId !== `custom:${key}`,
          ),
        },
      });
  });
}
export async function savePantry(input: unknown) {
  const userId = await member();
  const data = z
    .object({
      ids: z.array(foodIdInput).max(100),
      preferences: pantryPreferencesInput,
    })
    .parse(input);
  const foods = await resolveOwnedFoods(userId, data.ids);
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
  await prisma.memberPantry.upsert({
    where: { userId },
    create: {
      userId,
      foodIds: foods.map((food) => food.id),
      preferences: data.preferences,
    },
    update: {
      foodIds: foods.map((food) => food.id),
      preferences: data.preferences,
    },
  });
  return { saved: true };
}
export async function getPantrySuggestions(input: unknown) {
  const userId = await member();
  const parsed = suggestionInput.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Use a meal budget of 100-2000 kcal, protein of 0-200g, and valid optional macro limits.",
    );
  const data = parsed.data;
  const personal = (
    await prisma.customFood.findMany({ where: { userId }, take: 200 })
  ).map(labelFood);
  const matches = resolvePantry(data.text, personal);
  const chosen = await resolveOwnedFoods(userId, data.ids);
  const available = [
    ...new Map(
      [...chosen, ...matches.foods].map((food) => [food.id, food]),
    ).values(),
  ];
  if (available.length > 100)
    throw new Error(
      "Keep your pantry to 100 distinct foods. Remove some selections before adding more.",
    );
  const staples = [
    "chicken",
    "rice",
    "broccoli",
    "tofu",
    "lentils",
    "spinach",
    "yogurt",
    "oats",
    "banana",
    "beans",
    "fdc-168917",
    "fdc-173757",
  ].flatMap((id) => (officialFood(id) ? [officialFood(id)!] : []));
  return {
    matched: available,
    unknown: matches.unknown,
    ambiguous: matches.ambiguous,
    ideas: buildPantryIdeas(available, staples, data),
    unsuitable: available
      .filter((food) => !food.recipeEligible)
      .map((food) => food.name),
  };
}
