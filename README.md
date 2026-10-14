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

| Variable                            | Value                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | The PostgreSQL connection string from your Neon/database dashboard, with TLS enabled. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's publishable key for this app and environment.                                 |
| `CLERK_SECRET_KEY`                  | The secret key from the same Clerk instance.                                          |
| `NEXT_PUBLIC_URL`                   | The site's public URL (optional; currently unused by core flows).                     |

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
Tests also cover muscle priorities, calculated meals, pantry ideas, community
ownership/reporting, and session-token refresh. Browser workers run sequentially
to avoid contention in local development authentication; run preview capture
separately from the browser suite.

## Member Tools

The member hub uses a persistent desktop sidebar and four primary mobile
shortcuts. Nutrition starts with daily totals and meals, followed by Add meal,
Meal calculator, and Pantry ideas. The calculator's **Save to Add meal** and
pantry's **Use meal idea** fill the Add meal form for review; only the final
**Add meal** button logs food. Calculated meals retain their ingredient/source
snapshots and are recalculated on the server when added. Food cards can be
tapped directly, with a named search field and optional food-group filter.
Advanced tools and label scanning
load on demand; food searches and diary reads can be cancelled without
occupying the meal-save action queue. Confirmed saves update the diary from
the returned record. See the [member experience research and local performance
measurements](docs/member-experience-research.md) for the design rationale,
sources, validation coverage, and remaining performance limits.

Workouts also supports **Log another exercise** and **Log cardio**, including
members who have not generated a routine. Additional exercise entries record
each performed set, reps and lb/kg weights; cardio records minutes and optional
distance in km/miles. Entries persist in `workout_activities`, appear in workout
history, and contribute to separate overview activity/cardio totals. They do
not advance the planned split or change its progression. Retries reuse the
draft ID, and every read/write/delete is scoped to the signed-in member.
Additional-activity history currently shows the most recent 100 entries.

Movement photo references use 55 selected exercises from the pinned
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) public-domain
dataset. Local originals and license/source notices live in
`public/exercise-references/`; CSS displays them in black and white. Each
reference identifies the photographed variation and links its source. Run
`node scripts/import-exercise-references.mjs` to reproduce the assets. The
photos load lazily, and users can open a reference to compare its positions.

- Food diary: add/edit/delete meals, portions, calories, protein, carbs, and fat;
  choose a date and compare totals with intake targets. Previous manual daily
  totals are retained alongside new meals until the member deletes them.
- Workouts: log each set, save sessions without duplicates, choose training
  days, and view session history with weights, reps, and completion status.
- Progress: record body weight in lb or kg, view weight history/change, and
  upload or delete private progress photos.
- Dashboard: today's intake, weekly workout count, latest weight, and next
  steps based on missing intake or tracking records.
- Plan handoff: after a signed-in intake saves successfully, **View in
  Dashboard** opens the saved routine. A failed save shows a retry warning
  rather than pretending the dashboard was updated.
- Muscle priorities: optionally select balanced, chest, back, shoulders, arms,
  legs, glutes, or core in intake. Change priority, days, and experience in
  Dashboard > Profile without deleting tracking history. Focused splits use
  two small emphasis slots while retaining all original base movements.
- Session feedback: finishing shows completed versus planned sets, recorded
  weighted-rep volume (timed holds excluded), and recovery/progression feedback.
- Meal calculator: search over 8,000 source-backed foods by name/preparation,
  browse categories, choose gram weights or source household measures, and
  save calculated meals. Private label foods support brands and foods outside
  the catalog. The server recalculates totals and stores ingredient/source
  snapshots; deleting a personal food does not change existing meal history.
- Free label scanning: enter a food name, take/upload a nutrition-label photo,
  crop/rotate it, and review the extracted calorie/protein/carb/fat values.
  Reading runs on the member's device, not a paid AI/API service. Confirm the
  label column and reference weight before saving. New label reference portions
  are retained for later use; saving adds that portion to the calculator and
  fills an empty meal name. Meal logging still requires a separate save.
- Pantry ideas: confirm ingredients and their preparation states, save a
  personal pantry, choose any/vegetarian/vegan, exclude allergens/gluten, and
  set calorie/protein budgets with optional carb/fat limits. Available-only
  mode is the default. Extra staples, missing ingredients and infeasible
  targets stay visible. Daily targets and meals remaining guide editable
  default budgets; saved numeric overrides persist until cleared. These are bounded ingredient combinations, not AI,
  traditional recipes, or medical meal plans. Log food actually consumed.
- Community: member-only posts, topic categories, owner editing/deletion,
  comments, likes, pagination, and reports. Public display names are entered
  explicitly. No meals, weight, workouts, or photos are shared automatically.

## Community Moderation

Set optional `COMMUNITY_MODERATOR_IDS` to comma-separated **Clerk user IDs**
in `.env.local` and Vercel. Restart locally/redeploy after changes. This is a
server-only allowlist; never prefix it with `NEXT_PUBLIC_`. Find your user ID
in Clerk Dashboard > Users. Moderators see **Review reports** in Community,
can remove reported posts/comments, and dismiss reports. Post deletion also
removes its comments, likes and reports. Without configured moderators,
reports are stored but nobody has moderator privileges, so configure your ID
before opening the community publicly. Names are member-selected, not verified
identities or proof of professional credentials. Posting is limited to three
posts and ten comments per member per minute using database transactions.
These basic controls are not a replacement for active community moderation.

## Food Data And Archived Research

`app/data/food-catalog.json` contains **8,104 complete nutrient records** from
the official [USDA downloads](https://fdc.nal.usda.gov/download-datasets/):
SR Legacy April 2018 and Foundation April 2026. Each record preserves its FDC
ID/link, original description, preparation state, calories/protein/carbs/fat
per 100g and available source measures. Input SHA-256 hashes are included in
dataset metadata. The importer excluded 84 incomplete/invalid records instead
of treating missing nutrients as zero. No paid API or API key is required.

Coverage is international, not limited or ranked by a preferred cuisine:
American and Mexican foods, Caribbean/West African staples, Asian ingredients,
European/Mediterranean foods, plant-based proteins, and less-common grains,
roots and produce are searchable where USDA has records. It is **not every
food or every brand worldwide**. Garri, egusi, regional dishes, or brands without
an appropriate source entry must use an actual label/reference entry or manual
meal totals, not a guessed substitution for raw cassava or other similar foods.

To reproduce the current catalog, download/extract the two exact JSON releases
above and run:

```bash
node scripts/import-food-catalog.mjs PATH_TO_SR_LEGACY_JSON PATH_TO_FOUNDATION_JSON
```

`app/data/foods.json` and its old importer retain the original 18 featured IDs
and aliases for compatibility; the new catalog is the active library. Review
source-version names in the new importer before using a future USDA release.
Search/indexing lives in `food-catalog.ts` and uses Fuse.js on the server, with
at most 40 results per request. The full catalog is not a phone download.
Fuzzy/ambiguous pantry text requires explicit confirmation; saved pantry IDs
and personal foods are always resolved through the signed-in member's session.

### Nutrition Accuracy And Limits

- Weigh edible food in the listed raw/dry/cooked/drained state. Source household
  measures apply only to that exact food; do not assume a universal gram weight
  for a cup or tablespoon. Added oils/sauces and extra ingredients need logging.
- USDA values and package labels are estimates, not laboratory results for the
  member's meal. Label entries require all four macro values, serving grams,
  source/reference, preparation and diet/allergen declarations. Per-serving
  values are normalized to 100g; label calories are not replaced with a naive
  4/4/9 calculation. See [FDA label guidance](https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label).
- Allergen/diet tags inferred from generic descriptions are conservative hints,
  not independently verified product ingredients. Uncertain mixed products are
  excluded when applying allergen restrictions; unknown dietary classifications
  are excluded from vegetarian/vegan ideas. Check brands and cross-contact.
  Shellfish/gluten filtering is broader than the nine US major allergen labels.
  See [FDA food allergy guidance](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies).
- Condiments, raw flour, raw cassava and unsuitable mixed/preparation states
  remain searchable for calculation but are not automatic meal bases. Ideas
  count listed oils and stay within bounded serving sizes. Optimization is
  limited to six candidate foods per role for predictable server work; it is
  not an exhaustive recipe search or a proof that no possible meal can fit.
- Calorie budget is a maximum and protein target a minimum; optional carb/fat
  values are maxima. The UI reports over-budget/shortfall conditions instead of
  promising a match. Running out of a daily budget never blocks meal logging.
  General adult fitness estimates do not establish medical dietary adequacy,
  micronutrient coverage, or suitability for children/pregnancy/medical needs.
- Personal labels are private, capped at 200 per member, and pantries at 100
  unique foods. Calculated meals allow 1-30 ingredients with positive gram
  amounts up to 2,000g each. Manual editing replaces the ingredient snapshot
  so its breakdown cannot contradict the edited totals.

The Resources page and its homepage, footer, and dashboard links were removed
at the owner's request on October 13, 2026. `/resources` is no longer an app
route. This does not remove food calculation, pantry ideas, or member tracking.
`RESOURCE_CHECKLIST.md` and `resource-checklist.html` remain repository-only
research archives; they are not part of the published app. The HTML file opens
directly without a server and stores its selections in your browser only.

## Free Nutrition Label Scanning

### Member Workflow

1. Open Dashboard > Nutrition > Add label food and enter the item name.
2. Choose Take photo or Upload photo. Camera capture uses the device's native
   picker; camera availability and its output format depend on the device.
3. Select the nutrition panel with the crop handles, rotate if needed, choose
   the label language, and press Read label. Progress and Cancel scan remain
   available while reading.
4. Review the selected photo, recognized text, detected values, and warnings.
   If there are multiple columns, explicitly choose a column and whether its
   values are for one serving, 100g, or another gram reference portion.
5. Use detected values to fill the editable fields. Missing/approximate readings
   remain blank, not zero. Enter a gram reference weight if it was not readable;
   a 100g basis always requires exactly 100g. Correct any reading errors.
6. Check the macro/reference review box, independently review dietary/allergen
   declarations, and save. The library stores normalized per-100g values plus
   the original reference weight/basis. The calculator starts with that portion;
   adjust to the amount actually consumed and save the meal.

All of this is free for members. There is **no OCR subscription, paid vision API,
API key, scan credit system, or membership upgrade**. Hosting/auth/database
service costs remain the owner's infrastructure responsibility, as before.

### Privacy And Limits

- Photos are decoded, cropped and read in browser memory. They are not sent to
  the application server or a third-party OCR service, and are not retained in
  the food library. Only the confirmed numeric values and food/reference text
  go through the authenticated save action. Temporary image URLs are revoked.
- The first scan downloads self-hosted reader/model files. IndexedDB caches
  language models only, not label photos. Offline scanning can fail if the
  necessary reader assets are not available; manual entry remains usable when
  the app itself is available, and saving still needs a network connection.
- Inputs: JPEG, PNG or WebP, non-empty and at most 20 MB / 40 megapixels. HEIC,
  PDFs, GIFs, unreadable files and oversized images are rejected. PNG/WebP are
  read as a still image, not an animation. Headers are checked before decoding;
  images are resized and normalized losslessly before recognition.
- Languages: English, French/English and Spanish/English. Other scripts,
  handwriting, reflective/curved/blurry labels and unusual layouts are not
  guaranteed. Recognition confidence is an OCR diagnostic, not a probability
  that the nutrition numbers are correct. Below 50, automatic filling is disabled.
- Reading is capped at 90 seconds. Cancellation, errors, timeout, completion
  and leaving the form terminate the worker. Retaking or changing a photo/crop
  clears old proposals; changing reference/macros resets the review confirmation.
- The parser reads total protein/carbohydrate/fat, not saturated fat, sugars,
  net carbs, sodium, milligrams or daily-value percentages. It uses printed
  calories/kcal, not kilojoules or guessed 4/4/9 energy. `<1g` and other
  approximate amounts require a reviewed manual estimate. Milliliters/ounces
  are not assumed to equal a gram serving; do not infer density from a photo.
- Multi-column/as-prepared labels need explicit column and basis confirmation.
  A value absent from the selected column stays blank rather than borrowing
  another column's number. Conflicting portion weights are not silently chosen.
  OCR never verifies ingredient/allergen safety or automatically checks the
  allergen-review declaration. Label values are still estimates.

Serving/column distinctions follow the
[FDA label guidance](https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label).
The review workflow, conservative parser and confidence cutoff are app-specific
implementation choices, not FDA certification or a guarantee of exact reading.

### Implementation And Assets

The proven [Tesseract.js](https://github.com/naptha/tesseract.js) OCR engine is
pinned to 7.0.0. `react-image-crop` provides touch/keyboard crop selection.
`scripts/prepare-ocr-assets.mjs` copies the pinned worker, WebAssembly core
variants, English/French/Spanish `4.0.0_best_int` language data, license notices
and a file/hash manifest into ignored `public/ocr/v7/`. No build-time CDN
download is necessary beyond installing the lockfile's npm packages.

`npm run dev` and `npm run build` prepare these assets automatically. Run
`npm run ocr:assets` independently after `npm ci` when using another preview
setup. Install development dependencies before building: the model packages
are build inputs. The generated assets must be included in the deployed Next.js
public directory; do not delete them from an existing deployment. They are
ignored by Git/ESLint and regenerated reproducibly, not manually edited.

`app/lib/label-reader.ts` owns a native worker using the **pinned v7 worker
protocol**, allowing termination even while initialization/model loading is
pending. It does not reimplement the OCR engine. When upgrading Tesseract,
review its worker protocol/core paths, update the asset version and adapter
together, and rerun real image tests across desktop/mobile. Do not replace this
with an unreviewed cloud upload or a paid service without an explicit decision.

Key files:

| Change                                                            | File                                                                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Camera/upload, cropping, rotation, language, read/review controls | `app/dashboard/nutrition/LabelScanner.tsx`                                                                                         |
| Label fields, validation, review confirmation, reference defaults | `app/dashboard/nutrition/LabelFoodForm.tsx`                                                                                        |
| OCR worker lifecycle and model paths                              | `app/lib/label-reader.ts`                                                                                                          |
| Browser image limits, normalization, crop/rotation                | `app/lib/label-image.ts`                                                                                                           |
| Nutrient names, units, columns and ambiguity parsing              | `app/lib/nutrition-label.ts`                                                                                                       |
| Self-hosted OCR asset preparation                                 | `scripts/prepare-ocr-assets.mjs`                                                                                                   |
| Reference portion normalization/storage                           | `app/lib/actions/food-tools.ts`, `app/lib/food-input.ts`, `app/lib/owned-foods.ts`, `prisma/schema.prisma`, `prisma/bootstrap.sql` |
| Synthetic OCR fixture images                                      | `scripts/create-label-test-fixtures.mjs`, `e2e/fixtures/`                                                                          |
| Parser/worker regression tests                                    | `tests/nutrition-label.test.ts`, `tests/label-reader.test.ts`                                                                      |
| Real scanner/member/browser tests                                 | `e2e/label-scanner.spec.ts`                                                                                                        |

The checked-in fixture images are synthetic test data, not a marketed product
or a real member label. Regenerate them with
`node scripts/create-label-test-fixtures.mjs` after intentionally changing the
test layout. Tests cover real OCR and label/meal persistence, blank images,
unsupported files, cancellation, and manual recovery with disposable local
users. Physical camera hardware and every real-world label cannot be certified
by automated tests.

## Where To Change The New Features

| Change                                                            | File                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Muscle names and emphasis exercises                               | `app/lib/muscle-priority.ts`                                                                |
| Intake options and dashboard handoff                              | `app/starter-pack/components/StarterPackForm.tsx`, `app/starter-pack/StarterPackIntake.tsx` |
| Dashboard routine preferences                                     | `app/dashboard/profile/RoutinePreferences.tsx`, `app/lib/actions/routine.ts`                |
| Session feedback                                                  | `app/lib/workout-feedback.ts`, `app/dashboard/workouts/page.tsx`                            |
| Food data, source versions, aliases and ingredient classification | `app/data/food-catalog.json`, `scripts/import-food-catalog.mjs`                             |
| Search and pantry matching                                        | `app/lib/food-catalog.ts`, `app/dashboard/nutrition/FoodPicker.tsx`                         |
| Portion calculations and meal-idea bounds                         | `app/lib/food-types.ts`, `app/lib/pantry-planner.ts`                                        |
| Personal foods, pantry persistence and validation                 | `app/lib/actions/food-tools.ts`, `app/lib/owned-foods.ts`, `app/lib/food-input.ts`          |
| Nutrition controls and saved ingredient breakdown                 | `app/dashboard/nutrition/FoodTools.tsx`, `LabelFoodForm.tsx`, `MealIngredients.tsx`         |
| Community feed and permissions                                    | `app/dashboard/community/page.tsx`, `app/lib/actions/community.ts`                          |
| New database tables/columns                                       | `prisma/schema.prisma`, `prisma/bootstrap.sql`                                              |
| Archived resource shortlist (not published)                       | `RESOURCE_CHECKLIST.md`, `resource-checklist.html`                                          |

## How Adaptive Workouts Work

`app/lib/actions/workouts.ts` connects the member profile, routine data, saved
sessions, and set history. `app/lib/workout-progression.ts` owns the progression
rules; these are deterministic rules, not an AI service.

1. The intake starts blank. A member explicitly chooses goal, sex, training
   days, and experience. `isIntakeComplete()` checks these before generation;
   `CompletedIntakeForm` is the type accepted by the plan generator.
2. Sex and training days select the exercise split from `training.ts`.
   New members use at most two sets per exercise, returning members at most
   three, and consistent members use the routine's original set count.
3. Opening Workouts first resumes a saved, unfinished session. Otherwise the
   app chooses the day after the last finished session, wrapping around at the
   end of the member's split. Members can also select a day manually.
4. Save Session stores a draft and preserves its date and entries on reload.
   Finish Session requires at least one performed set marked complete, records
   optional effort feedback, and unlocks the next planned day. Finished sessions
   cannot be overwritten by a draft save. Finishing a partial workout is allowed;
   partial exercise data does not unlock load increases.
5. For each exercise, the app reads that member's completed sets. After a full
   exercise reaches its rep range, it can suggest another controlled rep at the
   same load. After two full exercise sessions above the upper rep target at a
   consistent load, it considers roughly a 2.5% load increase, rounded up to a
   2.5 lb increment and accepted only when the resulting increase is 2-10%.
6. A too-heavy effort check-in suggests a 5% lighter load on the next matching
   exercise. Timed holds do not use weighted progression. Missing history,
   mixed loads, and insufficient completed sets keep conservative baseline
   targets. Suggested values are displayed as targets, not entered as completed
   work; members record the weight/reps they actually perform.
7. Changing the intake creates a different routine key. Next-day scheduling
   starts from that routine's history, while relevant exercise performance
   remains available. Dashboard workout counts use finished sessions.

The load-increase range is informed by the
[ACSM progression position stand](https://pubmed.ncbi.nlm.nih.gov/19204579/).
The exact set counts, rounding, feedback rules, and UI workflow above are this
app's implementation choices. Change them in `workout-progression.ts` and the
workout action, then update `tests/workout-progression.test.ts` and run member
browser tests. These tools are general training guidance; individual coaching
stays with the coach.

## Where To Change Things

| What to change                                      | File or folder                                                          | Notes                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage hero, member promotions, membership CTAs   | `app/page.tsx`                                                          | `membershipFeatures` defines the three member promotions.                                                                                                             |
| Main logo                                           | `public/brand.png`                                                      | Used by the site, member hub, and authentication screens. Keep the filename or update references.                                                                     |
| Browser/app icon                                    | `app/layout.tsx`                                                        | `metadata.icons` uses the Gorilla Mentality logo instead of the Next.js/Vercel starter icon.                                                                          |
| Member promotion screenshots                        | `public/member-tools/`                                                  | Regenerate with `node scripts/capture-member-previews.mjs` while the local app and database are running. The script creates and cleans up its own demo account.       |
| Global fonts, page background, text defaults        | `app/globals.css`, `app/layout.tsx`                                     | Geist is loaded by Next.js; charcoal/white and yellow accents are the brand palette.                                                                                  |
| Header and footer                                   | `app/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`                | Navigation content is in `app/data/site.ts`.                                                                                                                          |
| Member navigation and logo                          | `app/dashboard/DashboardShell.tsx`                                      | Links, active states, sign-out, and mobile navigation.                                                                                                                |
| Sign-in/sign-up colors, logo, dev notice appearance | `app/layout.tsx`                                                        | Clerk Core 3 uses `appearance.variables`, `appearance.options`, and `appearance.elements`. The notice flag only changes presentation, not which instance/key is used. |
| Login/signup page copy                              | `app/login/page.tsx`, `app/signup/page.tsx`                             | `/sign-in` and `/sign-up` reuse these pages.                                                                                                                          |
| Testimonials, social links, FAQ, starter benefits   | `app/data/site.ts`                                                      | Image files are in `public/testimonials/`.                                                                                                                            |
| Intake labels and choices                           | `app/data/starter-pack/options.ts`                                      | `initialIntakeForm` deliberately contains no preselected choices.                                                                                                     |
| Intake layout and selection tiles                   | `app/starter-pack/components/StarterPackForm.tsx`, `OptionTile.tsx`     | Update validation when adding new required fields.                                                                                                                    |
| Intake submission/profile sync                      | `app/starter-pack/StarterPackIntake.tsx`, `app/api/profile/route.ts`    | The API uses the authenticated user ID, not a submitted account ID.                                                                                                   |
| Exercise names, sets/reps, split and day order      | `app/data/starter-pack/training.ts`                                     | Keep exercise names stable when you want to keep the same historical exercise identity.                                                                               |
| Exercise parsing and routine key                    | `app/lib/workout-plan.ts`                                               | Handles formats such as `4 sets x 6-10 reps` and `3 x 10-12`.                                                                                                         |
| Next-day scheduling, draft resume, saved sessions   | `app/lib/actions/workouts.ts`                                           | Authorization, database queries, and session transactions.                                                                                                            |
| Adaptive rep/load rules                             | `app/lib/workout-progression.ts`                                        | Test changes against incomplete sets, light loads, timed holds, and repeat saves.                                                                                     |
| Workout logger/history screens                      | `app/dashboard/workouts/`                                               | Numeric entries remain actual performed work, separate from suggested targets.                                                                                        |
| Nutrition targets and starter meal portions         | `app/lib/starter-pack/plan-generator.ts`                                | Weight is normalized to pounds, including `kg` intake.                                                                                                                |
| Starter foods/meal examples                         | `app/data/starter-pack/nutrition.ts`                                    | Separate from members' individually entered meals.                                                                                                                    |
| Food diary screen and storage                       | `app/dashboard/nutrition/page.tsx`, `app/lib/actions/meals.ts`          | Add/edit/delete entries by member and selected date.                                                                                                                  |
| Macro totals                                        | `app/lib/tracking-summary.ts`                                           | Adds current meals and historical manual daily totals without deleting either.                                                                                        |
| Weight entry/history                                | `app/dashboard/progress/WeightTracker.tsx`, `app/lib/actions/weight.ts` | Database weights are pounds; UI can display lb/kg. One entry per member/date.                                                                                         |
| Progress photos                                     | `app/dashboard/progress/page.tsx`, `app/api/progress/`                  | Image routes check ownership. Compression is in `prepare-photo.ts` and the upload route.                                                                              |
| Dashboard metrics and next steps                    | `app/dashboard/page.tsx`, `app/lib/actions/dashboard.ts`                | Weekly boundaries use the browser's local timezone.                                                                                                                   |
| Coaching inbox and form options                     | `app/data/coaching.ts`, `app/coaching/page.tsx`                         | Change `COACHING_EMAIL`; deliveries require FormSubmit activation.                                                                                                    |
| Feedback inbox and questions                        | `app/data/feedback.ts`, `app/feedback/page.tsx`                         | Change `FEEDBACK_EMAIL`; no test sends messages to the inbox.                                                                                                         |
| Data fields, relations, indexes                     | `prisma/schema.prisma`                                                  | Update `bootstrap.sql` together with schema additions.                                                                                                                |
| Deploy-time database setup                          | `prisma/bootstrap.sql`, `scripts/deploy-database.mjs`                   | Additive table creation in a transaction. It is not a general destructive migration tool.                                                                             |
| Validation and allowed numeric ranges               | `app/lib/validation.ts`                                                 | Server-side validation must remain authoritative.                                                                                                                     |
| Protected routes                                    | `proxy.ts`, `app/dashboard/layout.tsx`                                  | APIs return JSON 401 when signed out; dashboard pages redirect to login. Actions also check auth.                                                                     |
| PDF contents/colors/layout                          | `app/lib/starter-pack/pdf-export.ts`                                    | See the PDF section below.                                                                                                                                            |

### Brand Changes

The main accent is Tailwind `yellow-500` (`#eab308`), with `yellow-400` hover
states, zinc/black surfaces, white headings, and muted gray supporting text.
The existing raster logo adds metallic gold and cyan accents. To change the
palette, update public/member button classes and Clerk appearance variables,
then review the separate PDF `colors` object. Regenerate member-preview images
after visible UI changes so the homepage advertises the current interface.

Development-mode presentation is disabled through Clerk's supported appearance
option. Use the real production Clerk instance and configured domain on Vercel;
changing appearance does not promote a development instance to production.

## Data And Security Boundaries

| Model                 | Purpose                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Profile`             | Clerk user ID, intake, routine choices, calorie/protein targets.                                                   |
| `Exercise`            | Stable exercise identity used in routine and historical logs.                                                      |
| `WorkoutTemplate`     | Optional seeded catalog; live routines use the training data.                                                      |
| `WorkoutLog`          | Actual set weight, reps/duration, completion, and session date.                                                    |
| `WorkoutSession`      | Routine key, selected day, session date, draft/finished state, effort.                                             |
| `NutritionLog`        | Historical manually entered daily calorie/protein totals.                                                          |
| `MealEntry`           | Meals and macros for a selected date; optional immutable ingredient/source snapshot.                               |
| `CustomFood`          | Private label/reference values normalized to 100g, with optional reference weight and basis.                       |
| `MemberPantry`        | Member's confirmed food IDs and diet/allergen/preferences; not a weighed stock inventory.                          |
| `WeightEntry`         | Body weight normalized to lb, unique by member/date.                                                               |
| `ProgressPhoto`       | Private compressed JPEG payload and metadata.                                                                      |
| `CommunityPost`       | Member-shared text, public display name, topic, and owner.                                                         |
| `CommunityComment`    | Member replies; deleted with the parent post.                                                                      |
| `CommunityLike`       | One like per member/post.                                                                                          |
| `CommunityReport`     | Member reports visible only to configured moderators.                                                              |
| `CoachingApplication` | Existing model reserved for a future database-backed application flow; current applications go through FormSubmit. |

Server actions and API routes obtain the Clerk user ID from the session.
Private tracking reads/updates/deletes are filtered by that ID. Community
posts are visible to signed-in members, edits require ownership, and removal
also supports the server-side moderator allowlist. Never move Prisma or secret-key access
into client components. Do not commit `.env.local`, `.local`, test traces, or
database data. Daily meal/weight dates are stored as date-only values; workout
sessions use timestamps to identify separate sessions and repeat saves.

For an existing database schema change, inspect the proposed change first.
`bootstrap.sql` handles new tables and indexes, but renaming an existing column,
changing its type, or deleting it requires an explicit migration and data plan.
Do not add DROP/TRUNCATE/DELETE statements to the build-time bootstrap.

## Deployment And Release

1. Run lint and unit tests, then `npm run build` against the configured database.
2. Run member browser tests with local development keys and the local database.
   Screenshots and traces are written under ignored `test-results/`.
3. Review `git diff`, commit the source/assets, and push to `master`.
4. The connected Vercel project should build that commit. Confirm the commit
   hash in its deployment log and wait for Ready before testing the live site.
5. Check free signup/sign-in, intake save, a meal, a workout draft/finish/resume,
   weight entry, private photo, and sign-out. Coaching inbox delivery requires a
   separate FormSubmit activation/delivery check.

If a deployment fails, use its exact error. A TypeScript error is a code issue;
P1001/connection errors indicate `DATABASE_URL` or database reachability. An
unavailable sign-in page indicates missing/invalid Clerk keys. Production and
Preview environment scopes are separate; changes need a new deployment.

## Troubleshooting

| Symptom                                            | Check or action                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Member sign-in unavailable                         | Verify the exact Clerk variable names and valid matching instance keys; restart locally or redeploy Vercel.                                                   |
| Login UI loads but production rejects the origin   | Configure the live domain in the production Clerk instance.                                                                                                   |
| Prisma P1001                                       | Replace placeholder hostnames, confirm the database is running/reachable, and check the connection string.                                                    |
| Missing tracking tables                            | Run `npm run db:deploy`, then `npm run db:check`.                                                                                                             |
| Windows EPERM during Prisma generate               | Stop the running Next.js process that has the Prisma engine loaded, then retry.                                                                               |
| Local PostgreSQL reports another server is running | Check `npm run db:check`; reuse the running local database instead of starting a second copy.                                                                 |
| Workout load does not increase                     | Check performed-set completion, full set count, repeated consistent loads, rep targets, and the increment cap. A single or unfinished exercise is not enough. |
| Old nutrition total appears with new meals         | Historical manual totals are intentionally retained. Delete that visible entry if it represents the same intake you re-entered as meals.                      |
| Photo upload rejected                              | Use JPEG, PNG, or WebP under 20 MB before browser compression. The prepared upload is capped at 2 MB.                                                         |
| Coaching/feedback email not arriving               | Confirm recipient constants and activate FormSubmit from the recipient inbox.                                                                                 |
| Test signups fail on verification                  | Use development Clerk testing tokens; `+clerk_test@example.com` addresses use the test verification code. Never test with production member records.          |
| Screenshots no longer match the app                | Restart the built app and rerun `scripts/capture-member-previews.mjs`.                                                                                        |

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

## Stack And Dependencies

Use a current Node.js 22 or 24 LTS release and npm. `package-lock.json` pins the
installed dependency graph; use `npm ci` for a reproducible installation.

| Dependency                         | Role                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Next.js 16 / React 19 / TypeScript | App Router pages, server actions, API routes, and typed UI.                           |
| Tailwind CSS 4 / lucide-react      | Utility styling and interface icons.                                                  |
| Clerk Next.js SDK                  | Signup, email verification, sessions, profile settings, and sign-out.                 |
| Prisma 5 / PostgreSQL              | Persistent member profiles, sets, sessions, meals, weights, and photos.               |
| Zod                                | Server-side validation of member input.                                               |
| Fuse.js                            | Server-side food search; fuzzy matches never silently replace confirmed pantry foods. |
| Tesseract.js / tesseract.js-core   | Free on-device OCR worker and WebAssembly engine, self-hosted at build time.          |
| @tesseract.js-data/eng/fra/spa     | Build inputs for the self-hosted language models; not a third-party recognition API.  |
| react-image-crop                   | Touch and keyboard-accessible nutrition-label crop selection.                         |
| image-size                         | Client-side header checks that reject oversized/unsupported images before decoding.   |
| pdf-lib                            | Browser-generated starter-plan PDF files.                                             |
| sharp                              | Server-side image validation, resizing, and JPEG compression.                         |
| framer-motion                      | Existing transitions and testimonial interactions.                                    |
| Vitest                             | Unit and server-action regression tests.                                              |
| Playwright / Clerk testing helpers | Real browser workflows with disposable development users.                             |
| embedded-postgres / dotenv         | Local development database and configuration loading. Not an in-app member service.   |

There is no AI API key, Supabase client, Stripe checkout, or subscription gate
required by this version. External services used at runtime are Clerk,
PostgreSQL (for example Neon in production), and FormSubmit for inbox delivery.

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
- Change homepage hero/promotions: edit `app/page.tsx`; edit `app/data/site.ts` for shared content collections.
- Change shared header/footer links: edit `app/data/site.ts`.
- Change branded PDF output: edit `app/lib/starter-pack/pdf-export.ts`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

| Command                                    | Purpose                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                              | Next.js with hot reload, usually port 3000. Requires the configured database to be running for member tools. |
| `npm run build`                            | Generate Prisma client, apply additive database setup, and build the production app.                         |
| `npm run ocr:assets`                       | Prepare self-hosted OCR worker, core and model files from installed packages.                                |
| `npm run start`                            | Serve the existing production build. Rebuild after code changes.                                             |
| `npm run lint`                             | ESLint checks.                                                                                               |
| `npm test`                                 | Unit and server-action regression tests.                                                                     |
| `npm run test:e2e`                         | Public and real development-member browser workflows on desktop/mobile. Requires the app at localhost:3000.  |
| `npm run db:local`                         | Start persistent local PostgreSQL; leave it running in a separate terminal.                                  |
| `npm run db:deploy`                        | Create/add the required tables and indexes; never deletes existing records.                                  |
| `npm run db:check`                         | Read-only database/schema health check using `.env.local`.                                                   |
| `npm run prisma:seed`                      | Optional, non-destructive workout-template catalog seeding.                                                  |
| `node scripts/capture-member-previews.mjs` | Refresh the homepage's real app screenshots with a disposable local demo account.                            |
