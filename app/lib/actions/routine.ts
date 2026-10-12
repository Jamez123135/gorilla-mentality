"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { musclePriorities } from "@/app/lib/muscle-priority";

export async function getRoutinePreferences() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.profile.findUnique({ where: { id: userId } });
}

export async function saveRoutinePreferences(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const data = z
    .object({
      musclePriority: z.enum(musclePriorities),
      trainingDays: z.number().int().min(3).max(6),
      trainingExperience: z.enum(["new", "returning", "consistent"]),
    })
    .parse(input);
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.sex) throw new Error("Complete your starter intake first");
  await prisma.profile.update({ where: { id: userId }, data });
  return { saved: true };
}
