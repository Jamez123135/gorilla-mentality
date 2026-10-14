import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
Promise.all([
  prisma.profile.findFirst(),
  prisma.exercise.findFirst(),
  prisma.workoutTemplate.findFirst(),
  prisma.workoutLog.findFirst(),
  prisma.nutritionLog.findFirst(),
  prisma.progressPhoto.findFirst(),
  prisma.mealEntry.findFirst(),
  prisma.weightEntry.findFirst(),
  prisma.workoutSession.findFirst(),
  prisma.workoutActivity.findFirst(),
  prisma.communityPost.findFirst(),
  prisma.communityComment.findFirst(),
  prisma.communityLike.findFirst(),
  prisma.communityReport.findFirst(),
  prisma.customFood.findFirst(),
  prisma.memberPantry.findFirst(),
])
  .then(() => {
    console.log(
      "Database connection and tracking tables verified. No data changed.",
    );
  })
  .catch((error) => {
    console.error(
      `Database check failed (${error.errorCode || error.code || error.name}). Check DATABASE_URL and the Prisma schema.`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
