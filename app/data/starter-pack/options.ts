import type {
  CompletedIntakeForm,
  Experience,
  Goal,
  IntakeForm,
  SelectOption,
  Sex,
} from "@/app/types/starter-pack";

export const goalOptions: SelectOption<Goal>[] = [
  {
    value: "fat-loss",
    title: "Lose fat",
    body: "Higher movement, high protein, simple portions.",
  },
  {
    value: "muscle",
    title: "Build muscle",
    body: "More food, hard sets, and steady progression.",
  },
  {
    value: "recomp",
    title: "Recomp",
    body: "Hold habits steady while strength climbs.",
  },
];

export const sexOptions: SelectOption<Sex>[] = [
  { value: "male", title: "Male" },
  { value: "female", title: "Female" },
];

export const experienceOptions: SelectOption<Experience>[] = [
  {
    value: "new",
    title: "New",
    body: "Start controlled and learn the movements.",
  },
  {
    value: "returning",
    title: "Returning",
    body: "Build back rhythm with full sessions.",
  },
  {
    value: "consistent",
    title: "Consistent",
    body: "Push the top sets close to failure.",
  },
];

export const initialIntakeForm: IntakeForm = {
  name: "",
  goal: "",
  sex: "",
  days: null,
  age: "",
  height: "",
  weight: "",
  experience: "",
  musclePriority: "",
};

export function isIntakeComplete(
  form: IntakeForm,
): form is CompletedIntakeForm {
  return Boolean(
    form.goal &&
    form.sex &&
    form.days &&
    form.experience &&
    form.name.trim() &&
    form.age &&
    form.height.trim() &&
    form.weight.trim(),
  );
}

export function getTrainingDayDescription(days: number, sex: Sex) {
  if (sex === "female") {
    if (days === 3) return "2 lower + 1 upper";
    if (days === 4) return "2 lower + 2 upper";
    if (days === 5) return "3 lower + 2 upper";
    return "3 lower + 2 upper + glutes";
  }

  if (days === 3) return "Core manual days";
  if (days === 4) return "Add pump day";
  if (days === 5) return "Add back volume";
  return "Full volume week";
}
