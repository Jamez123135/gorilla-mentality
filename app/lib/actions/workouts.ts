"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import {
  workoutSessions,
  exerciseDefaults,
  routineKey,
} from "@/app/lib/workout-plan";
import { getProgression, nextTrainingDay } from "@/app/lib/workout-progression";
import { workoutInput } from "@/app/lib/validation";

export async function getWorkout(requestedDay = 0) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.sex || !profile.trainingDays) return null;
  const sessions = workoutSessions(
    profile.sex,
    profile.trainingDays,
    profile.musclePriority,
  );
  if (
    !Number.isInteger(requestedDay) ||
    requestedDay < 0 ||
    requestedDay > sessions.length
  )
    throw new Error("Invalid training day");
  const planKey = routineKey(profile);
  const recordedSessions = await prisma.workoutSession.findMany({
    where: { userId, planKey },
    orderBy: { workoutDate: "desc" },
    take: 30,
  });
  const active = recordedSessions.find(
    (session) =>
      !session.isCompleted &&
      (!requestedDay || session.dayNumber === requestedDay),
  );
  const lastFinished = recordedSessions.find((session) => session.isCompleted);
  const day =
    requestedDay ||
    active?.dayNumber ||
    nextTrainingDay(lastFinished?.dayNumber, sessions.length);
  const session = sessions[day - 1];
  const workoutDate = active?.workoutDate ?? new Date();
  const catalog = [];
  for (const item of session.exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name, muscleGroup: "General" },
    });
    const defaults = exerciseDefaults(item.details);
    const sets =
      profile.trainingExperience === "new"
        ? Math.min(2, defaults.sets)
        : profile.trainingExperience === "returning"
          ? Math.min(3, defaults.sets)
          : defaults.sets;
    catalog.push({
      id: exercise.id,
      name: exercise.name,
      sets,
      reps: defaults.reps,
    });
  }
  const logs = await prisma.workoutLog.findMany({
    where: { userId, exerciseId: { in: catalog.map((ex) => ex.id) } },
    orderBy: [{ workoutDate: "desc" }, { setNumber: "asc" }],
    take: 2000,
  });
  const exercises = catalog.map((exercise) => {
    const history = logs.filter(
      (log) =>
        log.exerciseId === exercise.id &&
        new Date(log.workoutDate).getTime() !== workoutDate.getTime(),
    );
    const lastDate = history.find((log) => log.isCompleted)?.workoutDate;
    const effort = lastDate
      ? recordedSessions.find(
          (saved) =>
            saved.workoutDate.getTime() === new Date(lastDate).getTime(),
        )?.effort
      : null;
    return {
      ...exercise,
      progression: getProgression(
        exercise.reps,
        exercise.sets,
        history,
        effort,
      ),
      savedSets: active
        ? logs.filter(
            (log) =>
              log.exerciseId === exercise.id &&
              log.workoutDate.getTime() === workoutDate.getTime(),
          )
        : [],
    };
  });
  return {
    title: session.title,
    days: sessions.length,
    day,
    workoutDate: workoutDate.toISOString(),
    resumed: Boolean(active),
    effort: active?.effort ?? null,
    isCompleted: false,
    exercises,
  };
}

export async function saveWorkout(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = workoutInput.safeParse(input);
  if (!parsed.success) throw new Error("Check your workout entries");
  const { sets, workoutDate, dayNumber, finished, effort } = parsed.data;
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.sex || !profile.trainingDays)
    throw new Error("Complete your intake first");
  const sessions = workoutSessions(
    profile.sex,
    profile.trainingDays,
    profile.musclePriority,
  );
  const session = sessions[dayNumber - 1];
  if (!session) throw new Error("Invalid training day");
  if (finished && !sets.some((set) => set.isCompleted))
    throw new Error("Mark your performed sets complete before finishing");
  const exercises = await prisma.exercise.findMany({
    where: {
      name: { in: session.exercises.map((ex) => ex.name) },
      isActive: true,
    },
    select: { id: true },
  });
  const allowed = new Set(exercises.map((ex) => ex.id));
  if (sets.some((set) => !allowed.has(set.exerciseId)))
    throw new Error("Exercise is not in this training day");
  const date = new Date(workoutDate);
  if (date.getTime() > Date.now() + 60000)
    throw new Error("Invalid workout date");
  const metadata = {
    dayNumber,
    title: session.title,
    planKey: routineKey(profile),
    effort,
    isCompleted: finished,
  };
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.workoutSession.findUnique({
        where: { userId_workoutDate: { userId, workoutDate: date } },
      });
      if (existing?.isCompleted) {
        if (!finished) throw new Error("This session is already finished");
        return {
          saved: await tx.workoutLog.count({
            where: { userId, workoutDate: date },
          }),
          finished: true,
        };
      }
      await tx.workoutLog.deleteMany({ where: { userId, workoutDate: date } });
      await tx.workoutLog.createMany({
        data: sets.map((set) => ({ ...set, userId, workoutDate: date })),
      });
      await tx.workoutSession.upsert({
        where: { userId_workoutDate: { userId, workoutDate: date } },
        update: metadata,
        create: { userId, workoutDate: date, ...metadata },
      });
      return { saved: sets.length, finished };
    },
    { isolationLevel: "Serializable" },
  );
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
