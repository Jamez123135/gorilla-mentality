-- Additive bootstrap for new databases and existing Prisma installations.
-- Existing tables and member records are retained.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" TEXT PRIMARY KEY, "updatedAt" TIMESTAMP(3) NOT NULL,
  "username" TEXT UNIQUE, "fullName" TEXT, "avatarUrl" TEXT,
  "sex" TEXT, "goal" TEXT, "currentWeight" DOUBLE PRECISION, "targetWeight" DOUBLE PRECISION,
  "trainingExperience" TEXT, "trainingDays" INTEGER, "targetCalories" INTEGER, "targetProtein" INTEGER
);
CREATE TABLE IF NOT EXISTS "exercises" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL UNIQUE, "muscleGroup" TEXT NOT NULL, "equipment" TEXT, "instructions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS "workout_templates" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "templateName" TEXT NOT NULL, "dayNumber" INTEGER NOT NULL, "orderIndex" INTEGER NOT NULL,
  "defaultSets" INTEGER NOT NULL, "defaultReps" TEXT NOT NULL, "notes" TEXT,
  "exerciseId" TEXT NOT NULL REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "workout_logs" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "exerciseId" TEXT NOT NULL REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "weight" DOUBLE PRECISION, "reps" INTEGER, "setNumber" INTEGER NOT NULL,
  "workoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "isCompleted" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS "nutrition_logs" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "logDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "calories" INTEGER, "protein" INTEGER,
  UNIQUE ("userId", "logDate")
);
CREATE TABLE IF NOT EXISTS "progress_photos" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "url" TEXT NOT NULL, "label" TEXT
);
CREATE TABLE IF NOT EXISTS "coaching_applications" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "currentGoal" TEXT NOT NULL,
  "experience" TEXT NOT NULL, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS "meal_entries" (
  "id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "logDate" DATE NOT NULL, "name" TEXT NOT NULL, "mealType" TEXT NOT NULL, "portion" TEXT,
  "calories" INTEGER NOT NULL, "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0, "fat" DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "meal_entries_userId_logDate_idx" ON "meal_entries"("userId", "logDate");
CREATE TABLE IF NOT EXISTS "weight_entries" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "logDate" DATE NOT NULL, "weightLb" DOUBLE PRECISION NOT NULL, UNIQUE ("userId", "logDate")
);
CREATE TABLE IF NOT EXISTS "workout_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "workoutDate" TIMESTAMP(3) NOT NULL, "planKey" TEXT NOT NULL, "dayNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL, "isCompleted" BOOLEAN NOT NULL DEFAULT false, "effort" TEXT,
  UNIQUE ("userId", "workoutDate")
);
CREATE INDEX IF NOT EXISTS "workout_sessions_userId_planKey_workoutDate_idx" ON "workout_sessions"("userId", "planKey", "workoutDate");
COMMIT;
