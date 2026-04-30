"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  Dumbbell,
  Flame,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { foodBank, goalLabels } from "@/app/lib/starter-pack/plan-generator";
import { createStarterPlanPdf } from "@/app/lib/starter-pack/pdf-export";
import type { Goal, StarterPlan } from "@/app/types/starter-pack";

export function GeneratedPlan({
  plan,
  goal,
  days,
  onAdjust,
}: {
  plan: StarterPlan;
  goal: Goal;
  days: number;
  onAdjust: () => void;
}) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  async function handleSavePdf() {
    setIsSavingPdf(true);

    try {
      const blob = await createStarterPlanPdf(plan, goal, days);
      const filename = `${plan.firstName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "gorilla"}-starter-plan.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      const shouldUseMobileShare =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 900);

      if (shouldUseMobileShare && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: plan.title,
            text: "Your Gorilla Mentality starter plan PDF.",
          });
          return;
        } catch {
          downloadPdf(blob, filename);
          return;
        }
      }

      downloadPdf(blob, filename);
    } finally {
      setIsSavingPdf(false);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/65 p-5 shadow-[0_45px_140px_-90px_rgba(255,255,255,0.3)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-5 border-b border-zinc-800 pb-7 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs font-semibold text-zinc-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Routine and meal plan generated
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            {plan.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Built from the {plan.splitLabel}, adjusted for {goalLabels[goal]},{" "}
            {days} training days, and your entered body details.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          <PlanMetric label="Calories" value={String(plan.nutrition.calories)} />
          <PlanMetric
            label="Protein"
            value={`${plan.nutrition.proteinMin}-${plan.nutrition.proteinMax}g`}
          />
        </div>
      </div>

      <TrainingSummary plan={plan} />
      <TrainingRoutine plan={plan} goal={goal} />
      <MealGuide plan={plan} />

      <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onAdjust}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 font-semibold text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Adjust intake
        </button>

        <button
          type="button"
          onClick={handleSavePdf}
          disabled={isSavingPdf}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isSavingPdf ? "Preparing PDF..." : "Save PDF"}
        </button>
      </div>
    </section>
  );
}

function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black text-zinc-50">{value}</p>
    </div>
  );
}

function TrainingSummary({ plan }: { plan: StarterPlan }) {
  const cards = [
    {
      icon: <Flame className="h-5 w-5 text-zinc-400" />,
      title: "Cardio",
      body: plan.trainingAdjustment.cardio,
    },
    {
      icon: <CalendarDays className="h-5 w-5 text-zinc-400" />,
      title: "Movement",
      body: plan.trainingAdjustment.steps,
    },
    {
      icon: <Dumbbell className="h-5 w-5 text-zinc-400" />,
      title: "Effort",
      body: plan.trainingAdjustment.effort,
    },
  ];

  return (
    <div className="mt-7 grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
        >
          <h3 className="flex items-center gap-2 font-bold">
            {card.icon}
            {card.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {card.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function TrainingRoutine({
  plan,
  goal,
}: {
  plan: StarterPlan;
  goal: Goal;
}) {
  return (
    <div className="mt-8">
      <h3 className="flex items-center gap-2 text-xl font-black">
        <Dumbbell className="h-5 w-5 text-zinc-400" />
        Training routine
      </h3>
      <p className="mt-2 text-sm text-zinc-400">{plan.setGuidance}</p>

      <div className="mt-4 grid gap-4">
        {plan.selectedSessions.map((session, index) => (
          <div
            key={session.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Day {index + 1}
                </p>
                <h4 className="mt-1 text-lg font-black text-zinc-50">
                  {session.title}
                </h4>
                <p className="mt-1 text-sm text-zinc-400">{session.intent}</p>
              </div>
              <span className="w-fit rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
                {goal === "muscle" ? "60-75 min" : "75-90 min"}
              </span>
            </div>

            <p className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
              Warm-up: {session.warmup}
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {session.exercises.map((exercise) => (
                <div
                  key={exercise.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <p className="text-sm font-bold text-zinc-100">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {exercise.details}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              Finish: {session.finisher}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealGuide({ plan }: { plan: StarterPlan }) {
  return (
    <div className="mt-8">
      <h3 className="flex items-center gap-2 text-xl font-black">
        <Utensils className="h-5 w-5 text-zinc-400" />
        Meal guide
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Built in the uploaded guide style: high protein, whole foods, portion
        control, no fried foods or added oils, no processed foods, zero sugar,
        and no alcohol.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <FoodList />
        <div className="grid gap-3">
          {plan.meals.map((meal) => (
            <div
              key={meal.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-black">{meal.title}</h4>
                <span className="shrink-0 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  {meal.calories} cal / {meal.protein}g
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                {meal.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-sm font-bold text-zinc-100">
          Sample day total: {plan.mealTotals.calories} calories and{" "}
          {plan.mealTotals.protein}g protein.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Use serving sizes to bring the sample day up or down to your target.
          Add or remove rice, potato, oats, fruit, or lean protein first.
        </p>
      </div>
    </div>
  );
}

function FoodList() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <h4 className="font-black">Food list</h4>
      <div className="mt-4 space-y-4">
        {[
          ["Proteins", foodBank.proteins],
          ["Carbs", foodBank.carbs],
          ["Volume foods", foodBank.volume],
        ].map(([label, foods]) => (
          <div key={label as string}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {label as string}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(foods as string[]).map((food) => (
                <span
                  key={food}
                  className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
