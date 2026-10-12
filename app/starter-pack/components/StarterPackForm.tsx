import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Sparkles,
  User,
} from "lucide-react";
import type { FormEvent } from "react";
import {
  experienceOptions,
  getTrainingDayDescription,
  goalOptions,
  sexOptions,
} from "@/app/data/starter-pack/options";
import type { IntakeForm } from "@/app/types/starter-pack";
import { FieldLabel } from "./FieldLabel";
import { OptionTile } from "./OptionTile";
import {
  muscleLabels,
  musclePriorities,
  type MusclePriority,
} from "@/app/lib/muscle-priority";

type Props = {
  form: IntakeForm;
  isLoading?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof IntakeForm>(
    key: Key,
    value: IntakeForm[Key],
  ) => void;
};

export function StarterPackForm({
  form,
  onSubmit,
  onChange,
  isLoading = false,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      aria-busy={isLoading}
      className="rounded-3xl border border-zinc-800 bg-zinc-950/65 p-5 shadow-[0_45px_140px_-90px_rgba(255,255,255,0.3)] backdrop-blur md:p-8"
    >
      <fieldset disabled={isLoading} className="min-w-0">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Starter intake
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Use real details so the training and meal targets come out closer
              to the person using the plan.
            </p>
          </div>
          <span className="hidden rounded-full border border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400 sm:inline-flex">
            No sign-up
          </span>
        </div>

        <div className="mt-7 space-y-8">
          <section>
            <FieldLabel icon={<Sparkles className="h-4 w-4" />}>
              Main goal
            </FieldLabel>
            <div className="grid gap-3 md:grid-cols-3">
              {goalOptions.map((goal) => (
                <OptionTile
                  key={goal.value}
                  active={form.goal === goal.value}
                  title={goal.title}
                  body={goal.body}
                  onClick={() => onChange("goal", goal.value)}
                />
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-semibold">
              Muscle priority (optional)
              <select
                value={form.musclePriority || ""}
                onChange={(event) =>
                  onChange(
                    "musclePriority",
                    event.target.value as MusclePriority | "",
                  )
                }
                className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3"
              >
                <option value="">Choose a priority</option>
                {musclePriorities.map((value) => (
                  <option key={value} value={value}>
                    {muscleLabels[value]}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section>
            <FieldLabel icon={<User className="h-4 w-4" />}>Sex</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {sexOptions.map((sex) => (
                <OptionTile
                  key={sex.value}
                  active={form.sex === sex.value}
                  title={sex.title}
                  onClick={() => onChange("sex", sex.value)}
                />
              ))}
            </div>
          </section>

          <section>
            <FieldLabel icon={<CalendarDays className="h-4 w-4" />}>
              Training days per week
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[3, 4, 5, 6].map((days) => (
                <OptionTile
                  key={days}
                  active={form.days === days}
                  title={`${days} days`}
                  body={
                    form.sex
                      ? getTrainingDayDescription(days, form.sex)
                      : undefined
                  }
                  onClick={() => onChange("days", days)}
                />
              ))}
            </div>
          </section>

          <section>
            <FieldLabel icon={<Dumbbell className="h-4 w-4" />}>
              Basic details
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Name"
                value={form.name}
                placeholder="First name"
                onChange={(value) => onChange("name", value)}
              />
              <TextInput
                label="Age"
                value={form.age}
                placeholder="28"
                type="number"
                min={18}
                max={90}
                onChange={(value) => onChange("age", value)}
              />
              <TextInput
                label="Height"
                value={form.height}
                placeholder="5'10 or 178 cm"
                onChange={(value) => onChange("height", value)}
              />
              <TextInput
                label="Weight"
                value={form.weight}
                placeholder="180 lb or 82 kg"
                onChange={(value) => onChange("weight", value)}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {experienceOptions.map((experience) => (
                <OptionTile
                  key={experience.value}
                  active={form.experience === experience.value}
                  title={experience.title}
                  body={experience.body}
                  onClick={() => onChange("experience", experience.value)}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            Free starter guidance based on the uploaded training and meal guide
            structure.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-6 py-3.5 font-bold text-black transition-all hover:bg-yellow-400 disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate my routine"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  type = "text",
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        required
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 outline-none transition focus:border-zinc-500"
      />
    </label>
  );
}
