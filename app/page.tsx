import Image from "next/image";
import Link from "next/link";
import PhilosophyGlowCard from "./components/PhilosophyGlowCard";
import { Reveal } from "./components/Reveal";
import SectionSliderTestimonials from "./components/SectionSliderTestimonials";
import { SiteBackground } from "./components/layout/SiteBackground";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SocialLinks } from "./components/layout/SocialLinks";
import { SectionHeader } from "./components/ui/SectionHeader";
import { faqs, processSteps, starterFeatures, testimonials } from "./data/site";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-white selection:text-zinc-950">
      <SiteBackground />
      <SiteHeader />
      <HeroSection />
      <PhilosophySection />
      <HowItWorksSection />
      <WhatYouGetSection />
      <SectionSliderTestimonials testimonials={testimonials} />
      <FaqSection />
      <FinalCtaSection />
      <SiteFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-14 md:grid-cols-2 md:py-24">
        <div className="flex flex-col">
          <Reveal>
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
              Free starter pack - Gym plans - 1-on-1 coaching
            </p>
          </Reveal>

          <Reveal>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              Discipline builds strength.
              <span className="block bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                Consistency builds the body.
              </span>
            </h1>
          </Reveal>

          <Reveal>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
              Get a free gym-based starter plan and goal-based nutrition basics.
              Simple, realistic, and repeatable.
            </p>
          </Reveal>

          <Reveal>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/starter-pack"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-6 py-3.5 font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_60px_-30px_rgba(255,255,255,0.55)] active:scale-[0.98]"
              >
                Get Free Starter Pack
              </Link>
              <Link
                href="#philosophy"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-3.5 font-semibold text-zinc-50 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900 active:scale-[0.99]"
              >
                Our philosophy
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-10 flex flex-col gap-5 border-t border-zinc-800/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-3 gap-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {["Free Plan", "Gym Focus", "Goal Based"].map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900/60"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <SocialLinks />
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="relative flex flex-col items-center md:items-center">
            <div className="relative w-full max-w-md">
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-3 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-all hover:-translate-y-1 hover:border-zinc-600 hover:shadow-[0_60px_160px_-70px_rgba(255,255,255,0.28)]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                  <Image
                    src="/brand.png"
                    alt="Gorilla Mentality brand visual"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PhilosophySection() {
  return (
    <section id="philosophy" className="mx-auto w-full max-w-6xl px-5 pb-14">
      <Reveal>
        <PhilosophyGlowCard />
      </Reveal>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 pb-14">
      <Reveal>
        <SectionHeader
          title="How it works"
          desc="Quick intake -> routine and meal guide -> you train. No sign-up required."
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {processSteps.map((step) => (
          <Reveal key={step.step}>
            <InfoCard eyebrow={step.step} title={step.title} body={step.body} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WhatYouGetSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
          <div className="pointer-events-none absolute -left-28 bottom-[-120px] h-80 w-80 rounded-full bg-white/8 blur-[100px]" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                What you get
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-400">
                A starter system you can repeat. Built for real life.
              </p>
            </div>

            <Link
              href="/starter-pack"
              className="inline-flex w-fit items-center justify-center rounded-2xl bg-zinc-50 px-6 py-3 font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_60px_-30px_rgba(255,255,255,0.55)] active:scale-[0.98]"
            >
              Get mine
            </Link>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {starterFeatures.map((feature) => (
              <InfoCard
                key={feature.title}
                title={feature.title}
                body={feature.body}
                accent
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16">
      <Reveal>
        <SectionHeader title="FAQ" />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {faqs.map((faq) => (
          <Reveal key={faq.q}>
            <InfoCard title={faq.q} body={faq.a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 md:p-12">
          <div className="pointer-events-none absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-32 left-[-100px] h-80 w-80 rounded-full bg-white/8 blur-[100px]" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to lock in?
            </h2>
            <p className="mt-3 max-w-xl text-zinc-400">
              Start with the free Starter Pack. If you want custom programming
              and accountability, apply for coaching.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/starter-pack"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-[0_18px_60px_-30px_rgba(255,255,255,0.55)] active:scale-[0.98]"
              >
                Get Free Starter Pack
              </Link>
              <Link
                href="/coaching"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/40 px-6 py-3.5 font-semibold text-zinc-50 transition-all hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900/70 active:scale-[0.99]"
              >
                Apply for coaching
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function InfoCard({
  eyebrow,
  title,
  body,
  accent = false,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="group rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 transition-all hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900/60 hover:shadow-[0_26px_80px_-55px_rgba(255,255,255,0.25)]">
      {eyebrow && (
        <p className="text-xs font-mono text-zinc-500 transition-colors group-hover:text-zinc-300">
          {eyebrow}
        </p>
      )}
      <p className="mt-2 text-lg font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      {accent && (
        <div className="mt-5 h-[2px] w-10 rounded-full bg-white/15 transition-all group-hover:w-16 group-hover:bg-white/30" />
      )}
    </div>
  );
}
