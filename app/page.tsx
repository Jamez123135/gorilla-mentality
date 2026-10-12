import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Utensils,
  TrendingUp,
  Check,
} from "lucide-react";
import SectionSliderTestimonials from "./components/SectionSliderTestimonials";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { faqs, processSteps, starterFeatures, testimonials } from "./data/site";

const membershipFeatures = [
  {
    title: "A next step for every session.",
    label: "Train",
    icon: Dumbbell,
    image: "workouts",
    body: "Log your sets, see your last performance, and get next-session targets as your strength develops.",
  },
  {
    title: "Know what fuels your goal.",
    label: "Fuel",
    icon: Utensils,
    image: "meals",
    body: "Keep your meals, portions, calories, and macros together. See your daily intake against your own targets.",
  },
  {
    title: "Keep the proof of your progress.",
    label: "Grow",
    icon: TrendingUp,
    image: "progress",
    body: "Follow your weight history and keep private progress photos. Your records stay with your account.",
  },
];
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-yellow-500 selection:text-black">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-zinc-800 bg-black">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-6xl">
          <Image
            src="/brand.png"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 520px, 200px"
            className="!bottom-auto !left-auto !right-4 !top-[58px] !h-[112px] !w-[80px] object-contain md:!inset-y-0 md:!right-0 md:!h-full md:!w-[46%] md:object-right"
          />
        </div>
        <div className="relative mx-auto flex min-h-[480px] max-w-6xl items-center px-5 py-8 md:min-h-[520px] md:py-12">
          <div className="max-w-lg md:max-w-[48%]">
            <p className="text-xs font-bold uppercase text-yellow-500">
              Free Membership. Real Commitment.
            </p>
            <h1 className="mt-4 max-w-[190px] text-4xl font-black leading-tight md:max-w-none md:text-6xl">
              Gorilla <span className="block text-yellow-500">Mentality</span>
            </h1>
            <p className="mt-4 text-lg font-semibold">
              Train with purpose. Keep getting stronger.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-300">
              Your training, meals, and progress belong in one place. Build the
              routine, record the work, and make your next session count.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/signup" className={primaryButton}>
                Join Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/starter-pack"
                className="text-sm font-semibold text-white underline decoration-zinc-600 underline-offset-4"
              >
                Get a starter plan
              </Link>
            </div>
            <p className="mt-4 text-sm">
              <Link
                href="/resources"
                className="font-semibold text-yellow-500 underline underline-offset-4"
              >
                Free training, food and recovery resources
              </Link>
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-zinc-300">
              <Check className="h-4 w-4 text-yellow-500" />
              Free tracking tools. No membership payment.
            </p>
          </div>
        </div>
      </section>

      <section
        id="membership"
        className="border-b border-zinc-800 bg-zinc-900/40"
      >
        <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase text-yellow-500">
                Gorilla Mentality Members
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                More consistency. Less guesswork.
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-400">
                One free account for the work you put in every day.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-bold text-yellow-500"
            >
              Become a member
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {membershipFeatures.map(
              ({ title, label, icon: Icon, image, body }) => (
                <article
                  key={label}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                >
                  <div className="relative aspect-[3/2] border-b border-zinc-800">
                    <Image
                      src={`/member-tools/${image}.png`}
                      alt={`Gorilla Mentality ${label.toLowerCase()} member tools`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-yellow-500">
                      <Icon className="h-4 w-4" />
                      {label}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {body}
                    </p>
                    <Link
                      href="/signup"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                    >
                      Start free
                      <ArrowRight className="h-4 w-4 text-yellow-500" />
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="philosophy"
        className="mx-auto max-w-6xl px-5 py-12 md:py-16"
      >
        <p className="text-xs font-semibold uppercase text-yellow-500">
          The Mentality
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold">
          Discipline builds strength. Consistency builds the body.
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-zinc-400">
          Gorilla Mentality is built around showing up, doing the work, and
          learning from each session. Your progress starts with the next choice
          you make.
        </p>
      </section>
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase text-yellow-500">
                Your Starting Point
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Get your Gorilla starter plan.
              </h2>
              <p className="mt-3 text-zinc-400">
                A gym routine and meal guide, based on the details you choose.
              </p>
            </div>
            <Link href="/starter-pack" className={primaryButton}>
              Build my plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {starterFeatures.map((feature) => (
              <div key={feature.title}>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how" className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-3xl font-bold">
          Start with a plan. Keep building.
        </h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-3">
          {processSteps.map((step) => (
            <div key={step.step}>
              <p className="text-sm font-bold text-yellow-500">{step.step}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>
      <SectionSliderTestimonials testimonials={testimonials} />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-3xl font-bold">Member Questions</h2>
        <div className="mt-7 divide-y divide-zinc-800">
          <details className="py-4">
            <summary className="cursor-pointer font-semibold">
              What does membership cost?
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Membership, starter plans, and all tracking tools are free.
              One-on-one coaching is a separate paid service, arranged directly
              with Gorilla Mentality.
            </p>
          </details>
          {faqs.map((faq) => (
            <details key={faq.q} className="py-4">
              <summary className="cursor-pointer font-semibold">
                {faq.q}
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="border-t border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10">
          <div>
            <p className="text-xs font-semibold uppercase text-yellow-500">
              Gorilla Mentality
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Make your next session count.
            </h2>
            <p className="mt-3 max-w-xl text-zinc-400">
              Join the free member community. For personal coaching, reach out
              and we will arrange your plan and payment directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={primaryButton}>
              Join Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/coaching"
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold hover:border-yellow-500"
            >
              1:1 Coaching
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
