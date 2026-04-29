"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { initialIntakeForm } from "@/app/data/starter-pack/options";
import { createStarterPlan } from "@/app/lib/starter-pack/plan-generator";
import type { IntakeForm } from "@/app/types/starter-pack";
import { GeneratedPlan } from "./components/GeneratedPlan";
import { PlanStepper } from "./components/PlanStepper";
import { StarterPackForm } from "./components/StarterPackForm";

export default function StarterPackIntake() {
  const [form, setForm] = useState<IntakeForm>(initialIntakeForm);
  const [generated, setGenerated] = useState(false);

  // The form is the only source of truth. The plan is derived from it, which
  // keeps state predictable and prevents stale generated output.
  const plan = useMemo(() => createStarterPlan(form), [form]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerated(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm<Key extends keyof IntakeForm>(
    key: Key,
    value: IntakeForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-white selection:text-zinc-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-white/12 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[32rem] w-[32rem] rounded-full bg-white/8 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner transition-all group-hover:border-zinc-600">
              <Image
                src="/brand.png"
                alt="Gorilla Mentality logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight">Gorilla Mentality</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                Train with purpose
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Link>
            <Link
              href="/coaching"
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              Coaching
            </Link>
            <Link
              href="/feedback"
              className="hidden rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900 sm:inline-flex"
            >
              Feedback
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
              Training and meals from the Gorilla system
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Build a plan that matches your goal and your body.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              The routine follows the updated Gorilla Mentality training manual,
              then adjusts cardio, portions, calories, and protein from your
              intake.
            </p>

            <PlanStepper generated={generated} />
          </aside>

          {!generated ? (
            <StarterPackForm
              form={form}
              onSubmit={handleSubmit}
              onChange={updateForm}
            />
          ) : (
            <GeneratedPlan
              plan={plan}
              goal={form.goal}
              days={form.days}
              onAdjust={() => setGenerated(false)}
            />
          )}
        </div>
      </section>
    </main>
  );
}
