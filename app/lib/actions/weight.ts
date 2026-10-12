"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { weightInput } from "@/app/lib/validation";

export async function getWeightHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { logDate: "desc" },
    take: 90,
  });
}

export async function saveWeight(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { date, weight, unit } = weightInput.parse(input);
  const logDate = new Date(`${date}T00:00:00.000Z`);
  const weightLb =
    Math.round((unit === "kg" ? weight * 2.20462 : weight) * 100) / 100;
  await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
  return prisma.weightEntry.upsert({
    where: { userId_logDate: { userId, logDate } },
    update: { weightLb },
    create: { userId, logDate, weightLb },
  });
}

export async function deleteWeight(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const result = await prisma.weightEntry.deleteMany({ where: { id, userId } });
  if (!result.count) throw new Error("Weight entry not found");
  return { deleted: true };
}
