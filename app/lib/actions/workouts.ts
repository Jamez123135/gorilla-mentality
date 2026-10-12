"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { workoutSessions, exerciseDefaults } from "@/app/lib/workout-plan";
import { workoutInput } from "@/app/lib/validation";

export async function getWorkout(day = 1) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.sex || !profile.trainingDays) return null;
  const sessions = workoutSessions(profile.sex, profile.trainingDays);
  if (!Number.isInteger(day) || day < 1 || day > sessions.length)
    throw new Error("Invalid training day");
  const session = sessions[day - 1];
  const exercises = [];
  for (const item of session.exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name, muscleGroup: "General" },
    });
    exercises.push({
      id: exercise.id,
      name: exercise.name,
      ...exerciseDefaults(item.details),
    });
  }
  return { title: session.title, days: sessions.length, exercises };
}

export async function saveWorkout(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = workoutInput.safeParse(input);
  if (!parsed.success) throw new Error("Check your workout entries");
  const { sets, workoutDate } = parsed.data;
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.sex || !profile.trainingDays)
    throw new Error("Complete your intake first");
  const names = workoutSessions(profile.sex, profile.trainingDays).flatMap(
    (session) => session.exercises.map((ex) => ex.name),
  );
  const exercises = await prisma.exercise.findMany({
    where: { name: { in: names }, isActive: true },
    select: { id: true },
  });
  const allowed = new Set(exercises.map((ex) => ex.id));
  if (sets.some((set) => !allowed.has(set.exerciseId)))
    throw new Error("Exercise is not in your plan");
  const date = new Date(workoutDate);
  if (date.getTime() > Date.now() + 60000)
    throw new Error("Invalid workout date");
  // Re-saving this session replaces its sets instead of inserting duplicates.
  await prisma.$transaction(
    [
      prisma.workoutLog.deleteMany({ where: { userId, workoutDate: date } }),
      prisma.workoutLog.createMany({
        data: sets.map((set) => ({ ...set, userId, workoutDate: date })),
      }),
    ],
    { isolationLevel: "Serializable" },
  );
  return { saved: sets.length };
}

export async function getWorkoutHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.workoutLog.findMany({
    where: { userId },
    orderBy: [{ workoutDate: "desc" }, { setNumber: "asc" }],
    take: 1000,
    include: { exercise: { select: { name: true } } },
  });
}
