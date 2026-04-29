import type { ReactNode } from "react";
import { ClipboardList, Dumbbell, Utensils } from "lucide-react";

type Step = {
  icon: ReactNode;
  title: string;
  body: string;
  active: boolean;
};

export function PlanStepper({ generated }: { generated: boolean }) {
  const steps: Step[] = [
    {
      icon: <ClipboardList className="h-4 w-4" />,
      title: "01 Intake",
      body: "Goal, sex, training days, weight, and experience.",
      active: !generated,
    },
    {
      icon: <Dumbbell className="h-4 w-4" />,
      title: "02 Training routine",
      body: "Manual-style sessions with sets, reps, and cardio.",
      active: generated,
    },
    {
      icon: <Utensils className="h-4 w-4" />,
      title: "03 Meal guide",
      body: "Calories, protein, food list, and sample day.",
      active: generated,
    },
  ];

  return (
    <div className="mt-8 grid gap-3">
      {steps.map((step) => (
        <div
          key={step.title}
          className={`rounded-2xl border p-4 transition-all ${
            step.active
              ? "border-zinc-500 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-950/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300">
              {step.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-zinc-100">{step.title}</p>
              <p className="text-xs text-zinc-400">{step.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
