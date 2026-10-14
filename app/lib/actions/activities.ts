"use server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { activityInput } from "@/app/lib/activity-input";

export async function saveActivity(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const data = activityInput.parse(input);
  const values = {
    logDate: new Date(`${data.date}T00:00:00.000Z`),
    kind: data.kind, name: data.name, notes: data.notes,
    sets: data.kind === "strength" ? data.sets.map((set) => ({
      reps: set.reps, weightLb: set.weight === null ? null : set.weight * (data.unit === "kg" ? 2.2046226218 : 1),
    })) : Prisma.DbNull,
    minutes: data.kind === "cardio" ? data.minutes : null,
    distance: data.kind === "cardio" ? data.distance : null,
    distanceUnit: data.kind === "cardio" && data.distance !== null ? data.distanceUnit : null,
  };
  return prisma.$transaction(async (tx) => {
    await tx.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });
    // A retry keeps the same draft ID. Compound ownership prevents editing another member's record.
    return tx.workoutActivity.upsert({
      where: { id_userId: { id: data.id, userId } },
      create: { id: data.id, userId, ...values }, update: values,
    });
  });
}
export async function getActivities() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.workoutActivity.findMany({ where: { userId }, orderBy: [{ logDate: "desc" }, { createdAt: "desc" }], take: 100 });
}
export async function deleteActivity(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  z.string().uuid().parse(id);
  const result = await prisma.workoutActivity.deleteMany({ where: { id, userId } });
  if (!result.count) throw new Error("Activity not found");
  return { deleted: true };
}
