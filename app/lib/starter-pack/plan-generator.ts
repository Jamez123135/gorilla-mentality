import { foodBank } from "@/app/data/starter-pack/nutrition";
import {
  femaleFocusedSessions,
  femaleSessionIndexesByDays,
  manualSessionIndexesByDays,
  manualSessions,
} from "@/app/data/starter-pack/training";
import type {
  Experience,
  Goal,
  CompletedIntakeForm,
  Meal,
  Sex,
  StarterPlan,
  TrainingAdjustment,
  TrainingSession,
} from "@/app/types/starter-pack";

export const goalLabels: Record<Goal, string> = {
  "fat-loss": "fat-loss",
  muscle: "muscle-building",
  recomp: "recomp",
};

/**
 * Strategy pattern:
 * Each sex can choose sessions differently while the public generator keeps
 * one stable API. Add another strategy here if the business rules grow.
 */
type SplitStrategy = {
  getSessions(days: number): TrainingSession[];
  getSplitLabel(days: number): string;
};

const manualSplitStrategy: SplitStrategy = {
  getSessions(days) {
    return manualSessionIndexesByDays[days].map((index) => manualSessions[index]);
  },
  getSplitLabel() {
    return "manual-style Gorilla split";
  },
};

const femaleSplitStrategy: SplitStrategy = {
  getSessions(days) {
    return femaleSessionIndexesByDays[days].map(
      (index) => femaleFocusedSessions[index],
    );
  },
  getSplitLabel(days) {
    if (days === 3) return "2 lower/glute days + 1 upper day";
    if (days === 4) return "2 lower/glute days + 2 upper days";
    if (days === 5) return "3 lower/glute days + 2 upper days";
    return "3 main lower/glute days + 2 upper days + 1 glute conditioning day";
  },
};

const splitStrategies: Record<Sex, SplitStrategy> = {
  male: manualSplitStrategy,
  female: femaleSplitStrategy,
};

export function createStarterPlan(form: CompletedIntakeForm): StarterPlan {
  const firstName = form.name.trim().split(" ")[0] || "Your";
  const nutrition = getNutritionTargets(form);
  const splitStrategy = splitStrategies[form.sex];
  const meals = getMeals(form.goal, nutrition.calories);

  return {
    firstName,
    title: `${firstName}'s ${form.days}-day ${goalLabels[form.goal]} starter plan`,
    nutrition,
    selectedSessions: splitStrategy.getSessions(form.days),
    splitLabel: splitStrategy.getSplitLabel(form.days),
    meals,
    mealTotals: meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
      }),
      { calories: 0, protein: 0 },
    ),
    trainingAdjustment: getTrainingAdjustment(form.goal),
    setGuidance: getSetGuidance(form.experience),
  };
}

export { foodBank };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function parseWeightInPounds(weight: string, sex: Sex) {
  const normalized = weight.toLowerCase();
  const match = normalized.match(/\d+(\.\d+)?/);
  if (!match) return sex === "male" ? 190 : 155;

  const value = Number(match[0]);
  return normalized.includes("kg") ? value * 2.20462 : value;
}

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

function getNutritionTargets(form: CompletedIntakeForm) {
  const weightLb = parseWeightInPounds(form.weight, form.sex);
  const maintenance = weightLb * (form.sex === "male" ? 14 : 13);

  const rawCalories =
    form.goal === "fat-loss"
      ? maintenance - 500
      : form.goal === "muscle"
        ? maintenance + 250
        : maintenance - 150;

  const calorieRange =
    form.goal === "fat-loss"
      ? form.sex === "male"
        ? [1700, 2400]
        : [1400, 2100]
      : form.goal === "muscle"
        ? form.sex === "male"
          ? [2300, 3400]
          : [1900, 2900]
        : form.sex === "male"
          ? [1900, 2800]
          : [1600, 2400];

  const calories = roundToNearest(
    clamp(rawCalories, calorieRange[0], calorieRange[1]),
    50,
  );
  const protein = roundToNearest(clamp(weightLb * 0.9, 130, 250), 5);

  return {
    calories,
    proteinMin: Math.max(120, protein - 15),
    proteinMax: Math.min(250, protein + 25),
  };
}

function getTrainingAdjustment(goal: Goal): TrainingAdjustment {
  if (goal === "muscle") {
    return {
      cardio:
        "Use 8-12 min easy incline walking as the warmup. Keep hard cardio low so food and recovery can drive muscle gain.",
      steps: "8,000-10,000 daily steps.",
      effort: "Push the final working set close to failure on machines and accessories.",
    };
  }

  if (goal === "recomp") {
    return {
      cardio:
        "Use 15-20 min incline walking before lifts, then add 10 min easy cardio after lower body days.",
      steps: "10,000-12,000 daily steps.",
      effort: "Leave 1-2 reps in the tank on compounds and push accessories harder.",
    };
  }

  return {
    cardio:
      "Keep the manual-style 30 min incline walk at 10 incline and 3 pace before lifting.",
    steps: "12,000-15,000 daily steps, with one active-rest mobility day.",
    effort: "Controlled reps first. Let the calorie deficit and daily movement do their job.",
  };
}

function getSetGuidance(experience: Experience) {
  if (experience === "new") {
    return "Use 2-3 working sets for the first two weeks, learn the machine setup, and stop 2 reps before form breaks.";
  }

  if (experience === "consistent") {
    return "Use the full listed volume. Push the last set of isolation work close to failure while keeping compounds clean.";
  }

  return "Use the listed sets, keep 1-2 reps in reserve on compounds, and make the last machine/accessory set hard.";
}

function getMeals(goal: Goal, calories: number): Meal[] {
  if (goal === "muscle") {
    return [
      {
        title: "Breakfast",
        items: ["1/2 cup oats", "1 scoop whey", "1 banana", "1 cup 1% milk"],
        calories: 475,
        protein: 38,
      },
      {
        title: "Lunch",
        items: ["6 oz chicken breast", "1-1.5 cups cooked rice", "mixed vegetables"],
        calories: calories > 2600 ? 700 : 585,
        protein: 62,
      },
      {
        title: "Snack",
        items: ["low-fat yogurt", "protein bar or whey shake", "berries"],
        calories: 360,
        protein: 30,
      },
      {
        title: "Dinner",
        items: ["salmon or lean beef", "sweet potato", "broccoli or spinach"],
        calories: calories > 2600 ? 760 : 610,
        protein: 45,
      },
    ];
  }

  if (goal === "recomp") {
    return [
      {
        title: "Breakfast",
        items: ["3 whole eggs", "egg whites", "vegetables", "protein shake"],
        calories: 480,
        protein: 58,
      },
      {
        title: "Lunch",
        items: [
          "whole wheat protein wrap",
          "shredded chicken",
          "cabbage or salad",
          "hot sauce",
        ],
        calories: 430,
        protein: 45,
      },
      {
        title: "Snack",
        items: ["apple", "boiled eggs", "pepper or vegetables"],
        calories: 300,
        protein: 14,
      },
      {
        title: "Dinner",
        items: ["lean ground beef stir fry", "potato or rice", "mixed vegetables"],
        calories: 650,
        protein: 50,
      },
    ];
  }

  return [
    {
      title: "Breakfast",
      items: ["4 scrambled eggs", "vegetables for volume", "protein shake"],
      calories: 480,
      protein: 58,
    },
    {
      title: "Lunch",
      items: [
        "protein wrap",
        "shredded chicken breast",
        "cabbage or vegetables",
        "hot sauce",
      ],
      calories: 400,
      protein: 44,
    },
    {
      title: "Snack",
      items: ["2 apples", "2 boiled eggs", "pepper or carrots"],
      calories: 310,
      protein: 14,
    },
    {
      title: "Dinner",
      items: [
        "lean ground beef",
        "2 potatoes",
        "vegetable stir fry with zero-cal spray",
      ],
      calories: 700,
      protein: 50,
    },
  ];
}
