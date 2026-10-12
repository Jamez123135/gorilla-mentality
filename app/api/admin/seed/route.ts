import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { manualSessions, femaleFocusedSessions } from "@/app/data/starter-pack/training";

export async function GET(req: Request) {
  // SECURITY: In a real app, you'd check for an admin secret here
  // const authHeader = req.headers.get("authorization");
  // if (authHeader !== "Bearer gorilla-admin-secret") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    console.log("🦍 Cloud Seeder started...");

    // 1. Clear existing data to prevent duplicates
    await prisma.workoutLog.deleteMany({});
    await prisma.workoutTemplate.deleteMany({});
    await prisma.exercise.deleteMany({});

    const allRoutines = [
      { sessions: manualSessions, prefix: "Male" },
      { sessions: femaleFocusedSessions, prefix: "Female" },
    ];

    for (const routine of allRoutines) {
      for (let i = 0; i < routine.sessions.length; i++) {
        const session = routine.sessions[i];
        const templateName = `${routine.prefix}-Day${i + 1}-${session.title}`;

        for (let j = 0; j < session.exercises.length; j++) {
          const exData = session.exercises[j];

          const exercise = await prisma.exercise.upsert({
            where: { name: exData.name },
            update: {},
            create: {
              name: exData.name,
              muscleGroup: "General",
            },
          });

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

    return NextResponse.json({ 
      message: "✅ Jungle seeding complete! All workouts are now in Neon." 
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
