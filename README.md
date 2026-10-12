# Gorilla Mentality

Next.js app for Gorilla Mentality's free membership, starter plans, workout
logging, meal diaries, and progress tracking. One-on-one coaching is paid and
arranged directly with the coach; there is no membership paywall or checkout.

## Local Setup And Deployment

1. Run `npm ci`.
2. Configure `.env.local` with real values using `.env.example` as a reference.
   For separate local development authentication, `npx clerk@latest init --accountless --no-skills --yes`
   provisions temporary development keys. To claim that development application,
   run `npx clerk@latest auth login` yourself.
3. For local PostgreSQL, run `npm run db:local` and leave that process running.
   It listens only on `127.0.0.1:54329`, keeps data in ignored `.local/postgres`,
   and replaces only a placeholder/local `DATABASE_URL`. It does not replace a
   hosted database connection or change production Clerk settings.
4. Run `npm run db:deploy`, then `npm run db:check`.
5. Run `npm run dev` to open the app locally.

Required member-service settings:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The PostgreSQL connection string from your Neon/database dashboard, with TLS enabled. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's publishable key for this app and environment. |
| `CLERK_SECRET_KEY` | The secret key from the same Clerk instance. |
| `NEXT_PUBLIC_URL` | The site's public URL (optional; currently unused by core flows). |

Set these in Vercel for Production, and also for Preview if testing preview
deployments. Redeploy after changing environment variables. Clerk's production
instance must be configured for your deployed domain.

The public pages, free plan generator, and PDF export work without Clerk.
When Clerk settings are missing or invalid, account pages show an unavailable
state and protected endpoints refuse requests. Member features require valid
Clerk credentials and a reachable database.

The production build runs `npm run db:deploy` before Next.js compilation. Its
transactional, additive `prisma/bootstrap.sql` creates the required tables and
indexes in new databases and adds member tools to existing Prisma databases.
It does not delete or overwrite existing tables or member records. Deployment
requires a reachable `DATABASE_URL` with permission to create tables. It does
not convert legacy Supabase schemas with different column types/names; those
require a separate data migration.

Keep `prisma/schema.prisma` and `prisma/bootstrap.sql` synchronized when adding
tables. `npm run prisma:seed` optionally populates workout templates without
deleting workout history. Dashboard routines do not require seeding.

All member data uses Prisma and Clerk user IDs. The `supabase/` SQL files are
historical references and must not be applied to the current database.
Progress photos are compressed to JPEG and stored in the existing PostgreSQL
`ProgressPhoto.url` field, then served through an owner-checked image route.
This requires no storage-service token, but increases database storage usage;
move the image payloads to private object storage if photo volume grows.

Coaching and feedback forms use FormSubmit. The recipient inbox must complete
FormSubmit activation for deliveries to work. Automated tests do not send email.
Stripe dependencies have been removed; Stripe environment variables are not
required. Contact and payment for one-on-one coaching are handled directly.

Validation commands:

```bash
npm run lint
npm test
npm run build
npx playwright install chromium
npm run start
npm run test:e2e
```

Browser tests cover public pages, mobile overflow, starter-plan generation,
PDF download, and signed-out access. Member tests use real development Clerk
sessions and local PostgreSQL to verify meals, workout persistence, weight logs,
dashboard totals, and sign-out. They create and remove their own test users and
run only against the local database and development Clerk keys. Server tests
also verify ownership and validation with mocks. Production credentials/domain
configuration and FormSubmit email delivery need a separate live check.

## Member Tools

- Food diary: add/edit/delete meals, portions, calories, protein, carbs, and fat;
  choose a date and compare totals with intake targets. Previous manual daily
  totals are retained alongside new meals until the member deletes them.
- Workouts: log each set, save sessions without duplicates, choose training
  days, and view session history with weights, reps, and completion status.
- Progress: record body weight in lb or kg, view weight history/change, and
  upload or delete private progress photos.
- Dashboard: today's intake, weekly workout count, latest weight, and next
  steps based on missing intake or tracking records.

## Project Structure

- `app/page.tsx` - landing page composition.
- `app/starter-pack/page.tsx` - route entry and metadata for the starter pack.
- `app/starter-pack/StarterPackIntake.tsx` - client state orchestration for the intake flow.
- `app/starter-pack/components/` - starter-pack presentation components.
- `app/components/layout/` - reusable site shell pieces like header, footer, and background.
- `app/components/ui/` - small generic UI helpers.
- `app/data/` - editable content and routine/meal configuration.
- `app/lib/` - business logic and plan-generation rules.
- `app/types/` - shared TypeScript types.
- `public/` - brand and testimonial media.

## Design Approach

The starter-pack flow uses a data-driven Strategy pattern:

- Training sessions live in `app/data/starter-pack/training.ts`.
- Meal/food data lives in `app/data/starter-pack/nutrition.ts`.
- Form options live in `app/data/starter-pack/options.ts`.
- Plan rules live in `app/lib/starter-pack/plan-generator.ts`.

This keeps React components focused on rendering, while the generator owns the
business decisions for sex, goal, training days, calories, protein, and meal
selection.

## How Starter Plans Are Generated

The starter-pack page does not use AI or random generation. It builds a plan
from structured data and deterministic rules.

1. The user fills out the intake form in
   `app/starter-pack/StarterPackIntake.tsx`.
2. The form state is passed into `createStarterPlan()` in
   `app/lib/starter-pack/plan-generator.ts`.
3. The generator reads the user's:
   - goal: fat loss, muscle, or recomp
   - sex: male or female
   - training days: 3, 4, 5, or 6
   - weight
   - training experience
4. A split strategy chooses the training routine:
   - male uses the manual-style Gorilla split from
     `app/data/starter-pack/training.ts`
   - female uses the glute/leg-focused split from the same file
5. The selected number of days decides how many sessions are pulled into the
   final plan. For example:
   - female 4-day plan = 2 lower/glute days + 2 upper days
   - female 5-day plan = 3 lower/glute days + 2 upper days
   - male/general plans follow the manual-style chest/arms, back/arms,
     legs/core, pump, and volume progression
6. Nutrition targets are calculated from weight, sex, and goal:
   - fat loss uses a calorie deficit
   - muscle gain uses a small calorie surplus
   - recomp stays closer to maintenance
   - protein is based on body weight and clamped into a practical range
7. Meal examples are selected by goal:
   - fat loss gets the lean, high-volume sample day
   - recomp gets a balanced high-protein sample day
   - muscle gain gets higher-calorie meals with more carbs
8. The generated result is rendered by
   `app/starter-pack/components/GeneratedPlan.tsx`.

The easiest way to extend the plan system is to edit the data first, then the
rules only when the decision logic needs to change.

## Branded PDF Export

The starter-pack plan can be saved as a designed Gorilla Mentality PDF from the
generated-plan screen.

The export uses `pdf-lib`, not browser print. That means the app builds an
actual PDF file in JavaScript instead of asking the phone or computer to print
the web page. This is why it works better on mobile.

PDF flow:

1. The user clicks `Save PDF` in
   `app/starter-pack/components/GeneratedPlan.tsx`.
2. The component calls `createStarterPlanPdf()` in
   `app/lib/starter-pack/pdf-export.ts`.
3. `pdf-export.ts` creates a new PDF with:
   - branded dark cover page
   - Gorilla Mentality title treatment
   - goal, training-days, calories, and protein cards
   - training routine pages
   - meal guide pages
   - page numbers and branded footer text
4. The PDF is returned to the browser as a `Blob`.
5. On desktop, the app forces a normal file download.
6. On mobile, the app uses the native share/save sheet when the browser
   supports file sharing. If sharing fails, it falls back to direct download.

To change the PDF design, edit `app/lib/starter-pack/pdf-export.ts`.

Common PDF edits:

- Change brand colors: update the `colors` object.
- Change margins/page size: update `pageSize`, `margin`, and `contentWidth`.
- Change cover layout: edit `drawCoverPage()`.
- Change workout cards: edit `drawTraining()`.
- Change meal-plan output: edit `drawMealGuide()`.

## Editing Common Things

- Add or change exercises: edit `app/data/starter-pack/training.ts`.
- Change calories/protein rules: edit `app/lib/starter-pack/plan-generator.ts`.
- Change form labels: edit `app/data/starter-pack/options.ts`.
- Change landing page copy: edit `app/data/site.ts`.
- Change shared header/footer links: edit `app/data/site.ts`.
- Change branded PDF output: edit `app/lib/starter-pack/pdf-export.ts`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
