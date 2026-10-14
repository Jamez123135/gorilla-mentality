import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Pinned public-domain dataset; original photographs are preserved.
const revision = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
const root = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${revision}`;
const ids = [
  "Barbell_Bench_Press_-_Medium_Grip", "Barbell_Incline_Bench_Press_-_Medium_Grip", "Dumbbell_Bench_Press",
  "Dumbbell_Flyes", "Machine_Bench_Press", "Machine_Bicep_Curl", "Dumbbell_Bicep_Curl", "Hammer_Curls",
  "Triceps_Pushdown", "Triceps_Pushdown_-_Rope_Attachment", "Cable_Rope_Overhead_Triceps_Extension", "Machine_Triceps_Extension",
  "Seated_Dumbbell_Press", "Side_Lateral_Raise", "Seated_Cable_Rows", "Bent_Over_Barbell_Row", "Wide-Grip_Lat_Pulldown", "Face_Pull",
  "Hack_Squat", "Leg_Press", "Leg_Extensions", "Standing_Calf_Raises", "Ab_Crunch_Machine", "Hyperextensions_Back_Extensions",
  "Barbell_Hip_Thrust", "Romanian_Deadlift", "Lying_Leg_Curls", "Seated_Leg_Curl", "One-Legged_Cable_Kickback", "Thigh_Abductor",
  "Dumbbell_Lunges", "Dumbbell_Step_Ups", "Goblet_Squat", "Cable_Hip_Adduction", "Pull_Through", "Reverse_Flyes",
  "Cable_Crunch", "Plank", "Bodyweight_Walking_Lunge", "Butt_Lift_Bridge", "Dead_Bug", "Split_Squat_with_Dumbbells",
  "Rowing_Stationary", "Stairmaster", "Barbell_Squat", "Bodyweight_Squat",
  "Leverage_Iso_Row", "One-Arm_Dumbbell_Row", "Bent_Over_Two-Dumbbell_Row",
  "Running_Treadmill", "Walking_Treadmill", "Bicycling_Stationary", "Barbell_Deadlift", "Pushups", "Pullups",
];
async function read(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Exercise source download failed: ${response.status} ${url}`);
  return response;
}
const source = await (await read(`${root}/dist/exercises.json`)).json();
const records = [];
await mkdir(resolve("public/exercise-references"), { recursive: true });
for (const id of ids) {
  const exercise = source.find((item) => item.id === id);
  if (!exercise) { console.log(`Skipped unavailable source ID: ${id}`); continue; }
  const images = await Promise.all(exercise.images.slice(0, 2).map(async (path, index) => {
    const target = `/exercise-references/${id}-${index}.jpg`;
    const destination = resolve(`public${target}`);
    try { await readFile(destination); }
    catch {
      const bytes = Buffer.from(await (await read(`${root}/exercises/${path}`)).arrayBuffer());
      await writeFile(destination, bytes);
    }
    return target;
  }));
  records.push({ id, name: exercise.name, images, instructions: exercise.instructions, sourceUrl: `https://github.com/yuhonas/free-exercise-db/tree/${revision}/exercises/${id}` });
}
await writeFile(resolve("app/data/exercise-references.json"), JSON.stringify({ revision, license: "Unlicense", exercises: records }, null, 2) + "\n");
await writeFile(resolve("public/exercise-references/LICENSE.txt"), await (await read(`${root}/LICENSE.md`)).text());
await writeFile(resolve("public/exercise-references/README.md"), `# Exercise photographs\n\nSource: https://github.com/yuhonas/free-exercise-db\nRevision: ${revision}\nLicense: Unlicense (included in LICENSE.txt).\n\nOriginal images are unmodified. The app displays them with a CSS grayscale filter. Names, source links and instructions are retained in app/data/exercise-references.json. Run node scripts/import-exercise-references.mjs to reproduce this selection.\n`);
console.log(`Imported ${records.length} exercise references and their movement photos.`);
