export type Goal = "fat-loss" | "muscle" | "recomp";

export type Sex = "male" | "female";

export type Experience = "new" | "returning" | "consistent";

export type CompletedIntakeForm = {
  name: string;
  goal: Goal;
  sex: Sex;
  days: number;
  age: string;
  height: string;
  weight: string;
  experience: Experience;
};

export type IntakeForm = Omit<
  CompletedIntakeForm,
  "goal" | "sex" | "days" | "experience"
> & {
  goal: Goal | "";
  sex: Sex | "";
  days: number | null;
  experience: Experience | "";
};

export type SelectOption<T extends string | number> = {
  value: T;
  title: string;
  body?: string;
};

export type Exercise = {
  name: string;
  details: string;
};

export type TrainingSession = {
  title: string;
  intent: string;
  warmup: string;
  exercises: Exercise[];
  finisher: string;
};

export type Meal = {
  title: string;
  items: string[];
  calories: number;
  protein: number;
};

export type NutritionTargets = {
  calories: number;
  proteinMin: number;
  proteinMax: number;
};

export type TrainingAdjustment = {
  cardio: string;
  steps: string;
  effort: string;
};

export type StarterPlan = {
  firstName: string;
  title: string;
  nutrition: NutritionTargets;
  selectedSessions: TrainingSession[];
  splitLabel: string;
  meals: Meal[];
  mealTotals: {
    calories: number;
    protein: number;
  };
  trainingAdjustment: TrainingAdjustment;
  setGuidance: string;
};
