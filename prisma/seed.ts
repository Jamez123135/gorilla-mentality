import { PrismaClient } from "@prisma/client";
import { manualSessions, femaleFocusedSessions } from "../app/data/starter-pack/training";
import { exerciseDefaults } from "../app/lib/workout-plan";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async tx => {
    for (const routine of [{ sessions: manualSessions, prefix: "Male" }, { sessions: femaleFocusedSessions, prefix: "Female" }]) {
      for (const [index, session] of routine.sessions.entries()) {
        const templateName = `${routine.prefix}-Day${index + 1}-${session.title}`;
        for (const [orderIndex, item] of session.exercises.entries()) {
          const exercise = await tx.exercise.upsert({ where: { name: item.name }, update: {}, create: { name: item.name, muscleGroup: "General" } });
          const defaults = exerciseDefaults(item.details);
          const data = { templateName, dayNumber: index + 1, orderIndex, defaultSets: defaults.sets, defaultReps: defaults.reps, exerciseId: exercise.id };
          const existing = await tx.workoutTemplate.findFirst({ where: { templateName, orderIndex } });
          if (existing) await tx.workoutTemplate.update({ where: { id: existing.id }, data });
          else await tx.workoutTemplate.create({ data });
        }
      }
    }
  }, { timeout: 60000 });
  console.log("Workout catalog seeded. Existing workout history was preserved.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
