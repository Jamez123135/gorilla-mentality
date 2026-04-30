import type { Metadata } from "next";
import { SiteBackground } from "@/app/components/layout/SiteBackground";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import {
  FEEDBACK_EMAIL,
  feedbackAreas,
  ratingOptions,
  userTypes,
} from "@/app/data/feedback";

export const metadata: Metadata = {
  title: "Feedback | Gorilla Mentality",
  description:
    "Share feedback and suggestions about the Gorilla Mentality web app.",
};

const formAction = `https://formsubmit.co/${FEEDBACK_EMAIL}`;

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-white selection:text-zinc-950">
      <SiteBackground />
      <SiteHeader showHomeLink />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 md:py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
            Web app feedback
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Tell me what you think.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
            This is for anyone using the website: starter pack users, coaching
            applicants, current clients, or people just checking things out.
            Your suggestions help improve the app.
          </p>
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400">
            <p className="font-bold text-zinc-100">Where feedback goes</p>
            <p className="mt-2">
              Feedback is sent to{" "}
              <span className="font-semibold text-zinc-200">
                Gorilla Mentality&apos;s inbox, where I read every message personally
              </span>
              .
            </p>
          </div>
        </aside>

        <form
          action={formAction}
          method="POST"
          className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_45px_140px_-90px_rgba(255,255,255,0.28)] md:p-7"
        >
          <input
            type="hidden"
            name="_subject"
            value="New Gorilla Mentality web app feedback"
          />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="text" name="_honey" className="hidden" tabIndex={-1} />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Feedback form
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
              Help improve the experience
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Short answers are fine. Honest details are even better.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <TextField label="Name" name="name" placeholder="Optional" />
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="Optional, if you want a reply"
            />
            <RadioGroup
              label="Which best describes you?"
              name="user_type"
              options={userTypes}
            />
            <CheckboxGroup
              label="What is your feedback about?"
              name="feedback_area"
              options={feedbackAreas}
            />
            <RadioGroup
              label="Overall experience"
              name="overall_rating"
              options={ratingOptions}
              helper="1 = needs work, 5 = excellent"
            />
            <TextArea
              label="What did you like?"
              name="what_worked"
              placeholder="Example: the routine layout, the meal guide, the design, the form..."
            />
            <TextArea
              label="What was confusing, missing, or hard to use?"
              name="what_needs_work"
              required
            />
            <TextArea
              label="What should I add next?"
              name="feature_suggestions"
              placeholder="Example: home workouts, saved plans, progress tracking, more meal options..."
            />
            <TextArea
              label="Anything else?"
              name="anything_else"
            />

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 font-black text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-[0.98] sm:w-fit"
            >
              Send feedback
            </button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: "text" | "email";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-100">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-100">
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-y rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
      />
    </label>
  );
}

function RadioGroup({
  label,
  name,
  options,
  helper,
}: {
  label: string;
  name: string;
  options: string[];
  helper?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-zinc-100">{label}</legend>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <input
              type="radio"
              name={name}
              value={option}
              className="h-4 w-4 accent-white"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-zinc-100">{label}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <input
              type="checkbox"
              name={`${name}[]`}
              value={option}
              className="mt-0.5 h-4 w-4 accent-white"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
