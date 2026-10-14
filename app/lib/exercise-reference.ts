import references from "@/app/data/exercise-references.json";
const matches: [RegExp, string][] = [
  [/dumbbell.*bench.*press/i, "Dumbbell_Bench_Press"],
  [/incline.*bench.*press/i, "Barbell_Incline_Bench_Press_-_Medium_Grip"],
  [/bench.*press/i, "Barbell_Bench_Press_-_Medium_Grip"],
  [/rear.*delt.*fly/i, "Reverse_Flyes"], [/chest.*fly/i, "Dumbbell_Flyes"],
  [/chest.*press/i, "Machine_Bench_Press"],
  [/rope.*pushdown|pushdown.*rope/i, "Triceps_Pushdown_-_Rope_Attachment"],
  [/pushdown/i, "Triceps_Pushdown"], [/overhead.*triceps/i, "Cable_Rope_Overhead_Triceps_Extension"],
  [/triceps.*(?:press|extension).*machine|machine.*triceps/i, "Machine_Triceps_Extension"],
  [/machine.*biceps.*curl/i, "Machine_Bicep_Curl"], [/hammer.*curl/i, "Hammer_Curls"],
  [/dumbbell.*curl/i, "Dumbbell_Bicep_Curl"],
  [/biceps?.*curl/i, "Dumbbell_Bicep_Curl"], [/shoulder.*press/i, "Seated_Dumbbell_Press"],
  [/lateral.*raise/i, "Side_Lateral_Raise"], [/face.*pull/i, "Face_Pull"],
  [/pulldown|pull.down/i, "Wide-Grip_Lat_Pulldown"], [/pull.up/i, "Pullups"],
  [/rowing|rower/i, "Rowing_Stationary"],
  [/machine.*row/i, "Leverage_Iso_Row"],
  [/one.arm.*dumbbell.*row/i, "One-Arm_Dumbbell_Row"],
  [/dumbbell.*row/i, "Bent_Over_Two-Dumbbell_Row"],
  [/barbell.*row/i, "Bent_Over_Barbell_Row"], [/row/i, "Seated_Cable_Rows"],
  [/hip.*thrust/i, "Barbell_Hip_Thrust"], [/romanian.*deadlift/i, "Romanian_Deadlift"],
  [/deadlift/i, "Barbell_Deadlift"], [/hack.*squat/i, "Hack_Squat"], [/goblet.*squat/i, "Goblet_Squat"],
  [/leg.*press/i, "Leg_Press"], [/leg.*extension/i, "Leg_Extensions"],
  [/seated.*hamstring.*curl/i, "Seated_Leg_Curl"], [/hamstring.*curl|leg.*curl/i, "Lying_Leg_Curls"],
  [/calf.*raise/i, "Standing_Calf_Raises"], [/crunch.*machine/i, "Ab_Crunch_Machine"],
  [/cable.*crunch/i, "Cable_Crunch"], [/back.*extension/i, "Hyperextensions_Back_Extensions"],
  [/kickback/i, "One-Legged_Cable_Kickback"], [/abductor/i, "Thigh_Abductor"],
  [/pull.through/i, "Pull_Through"],
  [/bulgarian.*squat|split.*squat/i, "Split_Squat_with_Dumbbells"],
  [/bodyweight.*squat/i, "Bodyweight_Squat"], [/squat/i, "Barbell_Squat"],
  [/step.up/i, "Dumbbell_Step_Ups"], [/bodyweight.*lunge/i, "Bodyweight_Walking_Lunge"],
  [/lunge/i, "Dumbbell_Lunges"], [/glute.*bridge/i, "Butt_Lift_Bridge"], [/dead.*bug/i, "Dead_Bug"],
  [/plank/i, "Plank"], [/push.up/i, "Pushups"],
  [/running|jogging|treadmill run/i, "Running_Treadmill"], [/walking|walk/i, "Walking_Treadmill"],
  [/cycling|bike|bicycl/i, "Bicycling_Stationary"],
  [/stairmaster|stair/i, "Stairmaster"],
];
export function exerciseReference(name: string) {
  if (!name.trim()) return null;
  const exact = references.exercises.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
  const id = matches.find(([pattern]) => pattern.test(name))?.[1];
  return exact ?? references.exercises.find((item) => item.id === id) ?? null;
}
