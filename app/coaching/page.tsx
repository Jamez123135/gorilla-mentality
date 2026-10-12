import type { Metadata } from "next";
import { SiteBackground } from "@/app/components/layout/SiteBackground";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import {
  COACHING_EMAIL,
  ageRanges,
  checkInMethods,
  creditPreferences,
  dietStyles,
  focusAreas,
  gymAccess,
  liftingDays,
  mealCounts,
  nutritionStruggles,
  photoSharingOptions,
  primaryGoals,
  progressPhotoOptions,
  sessionLengths,
  sleepRanges,
  stepRanges,
  trainingExperience,
  weeklyActivity,
} from "@/app/data/coaching";

export const metadata: Metadata = {
  title: "Coaching Application | Gorilla Mentality",
  description:
    "Apply for Gorilla Mentality coaching with a detailed fitness and nutrition intake form.",
};

const formAction = `https://formsubmit.co/${COACHING_EMAIL}`;

export default function CoachingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-white selection:text-zinc-950">
      <SiteBackground />
      <SiteHeader showHomeLink />

      <section className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
              Personalized 12-week plan
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Gorilla Mentality coaching application.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              Complete this form thoroughly so your training, nutrition, and
              check-in plan can be tailored to your goal, schedule, gym access,
              and lifestyle.
            </p>
            <p className="mt-4 text-sm text-zinc-400">
              One-on-one coaching is a paid service. We will discuss your plan
              and payment directly after your application. Membership and
              tracking tools are free.
            </p>
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400">
              <p className="font-bold text-zinc-100">Where it goes</p>
              <p className="mt-2">
                Submissions are sent to{" "}
                <span className="font-semibold text-zinc-200">
                  Gorilla Mentality&apos;s inbox, where I read every application
                </span>
                .
              </p>
            </div>
          </aside>

          <form action={formAction} method="POST" className="space-y-5">
            {/* FormSubmit configuration. Swap this action for a custom API later if needed. */}
            <input
              type="hidden"
              name="_subject"
              value="New Gorilla Mentality coaching application"
            />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="text" name="_honey" className="hidden" tabIndex={-1} />

            <FormSection
              eyebrow="Section 1"
              title="Contact details"
              description="Basic details so the application can be matched to the right person."
            >
              <TextField label="Full name" name="full_name" required />
              <TextField label="Instagram handle" name="instagram_handle" />
              <TextField
                label="Email (to send your plan)"
                name="email"
                type="email"
                required
              />
              <RadioGroup
                label="Age range"
                name="age_range"
                options={ageRanges}
              />
              <RadioGroup
                label="Sex"
                name="sex"
                options={["Male", "Female", "Prefer not to say"]}
              />
            </FormSection>

            <FormSection
              eyebrow="Section 2"
              title="Goal and timeline"
              description="The next 12 weeks should have one clear direction."
            >
              <RadioGroup
                label="Primary goal (next 12 weeks)"
                name="primary_goal"
                options={primaryGoals}
                required
              />
              <CheckboxGroup
                label="Your #1 focus"
                name="focus_area"
                options={focusAreas}
                required
              />
              <TextArea
                label="Target outcome"
                name="target_outcome"
                placeholder="Example: Lose 10-15 lbs and get stronger."
                required
              />
            </FormSection>

            <FormSection
              eyebrow="Section 3"
              title="Current body and training"
              description="These details help tailor training volume, calories, and progression."
            >
              <TextField
                label="Height"
                name="height"
                placeholder="Example: 5'10 or 178 cm"
              />
              <TextField
                label="Current weight"
                name="current_weight"
                placeholder="Example: 185 lbs or 84 kg"
                required
              />
              <RadioGroup
                label="Training experience"
                name="training_experience"
                options={trainingExperience}
              />
              <RadioGroup
                label="Current weekly activity (outside the gym)"
                name="weekly_activity"
                options={weeklyActivity}
              />
            </FormSection>

            <FormSection
              eyebrow="Section 4"
              title="Gym and schedule"
              description="This shapes the exercises, equipment, and session length."
            >
              <RadioGroup
                label="How many days/week can you lift?"
                name="lifting_days"
                options={liftingDays}
                required
              />
              <RadioGroup
                label="Preferred session length"
                name="session_length"
                options={sessionLengths}
              />
              <CheckboxGroup
                label="Gym access"
                name="gym_access"
                options={gymAccess}
                required
              />
              <TextArea label="Any exercises you love?" name="exercises_love" />
              <TextArea
                label="Any exercises you hate / will not do?"
                name="exercises_hate"
              />
              <TextArea
                label="Injuries or limitations?"
                name="injuries_limitations"
                placeholder='If none, write "none."'
              />
            </FormSection>

            <FormSection
              eyebrow="Section 5"
              title="Nutrition and lifestyle"
              description="Short notes on meals, habits, and check-ins make the plan easier to follow."
            >
              <RadioGroup
                label="Diet style"
                name="diet_style"
                options={dietStyles}
              />
              <TextArea
                label="Food allergies / foods you avoid"
                name="food_allergies_avoid"
              />
              <RadioGroup
                label="How many meals/day do you prefer?"
                name="meals_per_day"
                options={mealCounts}
              />
              <CheckboxGroup
                label="Biggest nutrition struggle"
                name="nutrition_struggle"
                options={nutritionStruggles}
              />
              <RadioGroup
                label="Sleep (average per night)"
                name="sleep_average"
                options={sleepRanges}
              />
              <RadioGroup
                label="Steps per day (estimate)"
                name="steps_per_day"
                options={stepRanges}
              />
              <TextField
                label="Best day/time for monthly check-in message"
                name="check_in_time"
                placeholder="Example: Sundays at 6pm"
              />
              <RadioGroup
                label="Preferred check-in method"
                name="check_in_method"
                options={checkInMethods}
              />
            </FormSection>

            <FormSection
              eyebrow="Section 6"
              title="Progress photos and consent"
              description="Optional testimonial preferences if you choose to share progress photos."
            >
              <RadioGroup
                label="Progress photos"
                name="progress_photos"
                options={progressPhotoOptions}
              />
              <RadioGroup
                label="If you are willing to share photos, how can I share them?"
                name="photo_sharing"
                options={photoSharingOptions}
              />
              <RadioGroup
                label="Name/credit preference"
                name="credit_preference"
                options={creditPreferences}
              />
              <CheckboxGroup
                label="Consent statement"
                name="photo_consent"
                options={[
                  "If I choose to send progress photos, I allow Gorilla Mentality to repost them for testimonials. I can ask for removal later.",
                ]}
              />
            </FormSection>

            <FormSection
              eyebrow="Section 7"
              title="Final notes"
              description="The more honest this section is, the better the coaching can fit real life."
            >
              <TextArea
                label="Anything else I should know to tailor your plan?"
                name="anything_else"
                required
              />
              <TextArea
                label="What is the biggest obstacle you foresee that might hinder your progress?"
                name="biggest_obstacle"
              />
              <CheckboxGroup
                label="Personal-use agreement"
                name="personal_use_agreement"
                options={[
                  "I agree this plan is for my personal use only (no sharing/reselling).",
                ]}
                required
              />
            </FormSection>

            <FormSection
              eyebrow="Section 8"
              title="Feedback and suggestions"
              description="Use this space to tell me what would make the coaching experience better for you."
            >
              <TextArea
                label="What are you hoping Gorilla Mentality helps you with most?"
                name="coaching_expectations"
                placeholder="Example: structure, accountability, confidence, nutrition discipline, training intensity..."
              />
              <TextArea
                label="Do you have any suggestions, concerns, or preferences for your plan?"
                name="client_suggestions"
                placeholder="Example: exercises you want included, foods you enjoy, communication style, motivation style..."
              />
              <TextArea
                label="What would make you feel fully supported during the next 12 weeks?"
                name="support_preferences"
              />
              <TextArea
                label="Any other feedback or message you want to leave?"
                name="additional_feedback"
              />

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 font-black text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-[0.98] sm:w-fit"
              >
                Submit coaching application
              </button>
            </FormSection>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_45px_140px_-90px_rgba(255,255,255,0.28)] md:p-7">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      <div className="mt-6 grid gap-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: "text" | "email";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-100">
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
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
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-zinc-100">
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </legend>
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
              required={required}
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
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  const shouldRequireEveryBox = required && options.length === 1;

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-zinc-100">
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </legend>
      {required && options.length > 1 && (
        <p className="mt-1 text-xs text-zinc-500">
          Choose one or more that apply.
        </p>
      )}
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
              required={shouldRequireEveryBox}
              className="mt-0.5 h-4 w-4 accent-white"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
