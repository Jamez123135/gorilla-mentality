import { PrismaClient } from "@prisma/client";
import { manualSessions, femaleFocusedSessions } from "@/app/data/starter-pack/training";

const prisma = new PrismaClient();

async function main() {
  console.log("🦍 Starting the Jungle Seeder...");

  // 1. Clear existing data to prevent duplicates
  await prisma.workoutLog.deleteMany({});
  await prisma.workoutTemplate.deleteMany({});
  await prisma.exercise.deleteMany({});

  console.log("🧹 Cleaned existing data.");

  const allRoutines = [
    { sessions: manualSessions, prefix: "Male" },
    { sessions: femaleFocusedSessions, prefix: "Female" },
  ];

  for (const routine of allRoutines) {
    for (let i = 0; i < routine.sessions.length; i++) {
      const session = routine.sessions[i];
      const templateName = `${routine.prefix}-Day${i + 1}-${session.title}`;

      console.log(`🌱 Seeding template: ${templateName}`);

      for (let j = 0; j < session.exercises.length; j++) {
        const exData = session.exercises[j];

        // Upsert the exercise
        const exercise = await prisma.exercise.upsert({
          where: { name: exData.name },
          update: {},
          create: {
            name: exData.name,
            muscleGroup: "General", // Default, can be expanded
          },
        });

        // Extract default sets and reps from the 'details' string (e.g., "4 sets x 6-10 reps")
        const setsMatch = exData.details.match(/(\d+)\s*sets?/i);
        const repsMatch = exData.details.match(/(\d+-\d+|\d+)\s*reps?/i);

        await prisma.workoutTemplate.create({
          data: {
            templateName,
            dayNumber: i + 1,
            orderIndex: j,
            defaultSets: setsMatch ? parseInt(setsMatch[1]) : 3,
            defaultReps: repsMatch ? repsMatch[1] : "8-12",
            exerciseId: exercise.id,
          },
        });
      }
    }
  }

  console.log("✅ Jungle seeding complete! All workouts are now in Neon.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
