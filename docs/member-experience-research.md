# Member experience and performance review

Reviewed October 13, 2026. Scope: the existing Next.js 16.4 / React 19 member hub, with nutrition as the priority. This is a source and workflow audit supported by published usability guidance; it is not a study of this app's members.

October 14 follow-up: the user requested a single final logging step. **Add meal** now replaces the Quick entry tab described in the original review below. **Save to Add meal** in the calculator and **Use meal idea** in the pantry prepare that form without creating a diary entry. Only its final Add meal button persists the meal, retaining server-recalculated ingredient/source snapshots. The dropdown/plus food selector was replaced by directly tappable food cards. Workouts now includes independently saved off-plan exercises and cardio, plus local grayscale movement photos. The measurements below are historical results of the October 13 optimization pass.

October 14 validation: production build, TypeScript, targeted lint and whitespace checks pass. All 132 unit tests pass. Browser checks verified off-plan exercise/cardio persistence, history and overview totals, movement photos, explicit meal review, pantry handoff, label scanning, and existing member flows across desktop, phone and 320 pixel screens. A focused check also verified that deleting a previous daily total preserves a calculated meal waiting for review. The photographs cover 55 exercise references and retain the pinned [public-domain source](https://github.com/yuhonas/free-exercise-db) and license notices.

## Research and decisions

| Evidence | Application in this app |
| --- | --- |
| [NN/G: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) recommends putting frequent tasks first and making specialized options easy to discover. This is established usability research, not a new visual trend. | Daily totals and logged meals lead the nutrition page. Quick entry, Meal calculator, and Pantry ideas are explicit choices. Personal labels and scanning appear when requested. |
| [NN/G: response times](https://www.nngroup.com/articles/response-times-3-important-limits/) explains why immediate acknowledgment matters even when an operation takes longer. | Navigation shows pending feedback; loading placeholders retain a useful page shape. Saves show pending/success/error states, and returned saved records update the diary directly. |
| [Next.js: navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating) documents partial prefetching for dynamic routes with loading boundaries and feedback with `useLinkStatus`. | The member hub has a shared loading boundary, persistent navigation, and per-link pending indicators. Default framework prefetching is retained. |
| [Next.js: lazy loading](https://nextjs.org/docs/app/guides/lazy-loading) explains deferring client components and libraries until needed. | Quick entry does not mount the calculator/pantry module. Label forms and scanner UI have separate dynamic imports. The full food catalog remains on the server. |
| [Next.js: mutations](https://nextjs.org/docs/app/getting-started/mutating-data) says client Server Functions are dispatched sequentially and recommends other fetching paths when reads need concurrency. | Live food search and date-specific diary reads use authenticated GET handlers. Saves continue using authenticated Server Actions. Search no longer occupies the action queue ahead of a save. |
| [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) describes cancelling fetches. | Typing again or changing a date aborts the superseded browser request. Active/version guards prevent late responses from replacing newer state. Cancellation does not guarantee that already-started server/database work stops. |
| [W3C: target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets a 24 CSS pixel minimum with defined exceptions and distinguishes the 44 pixel enhanced criterion. | Date controls and meal edit/delete actions use 44 pixel targets. Four labeled primary destinations stay reachable at the bottom on phones, with secondary destinations in More member tools. This is an app-specific design choice rather than evidence that every app needs a bottom bar. |
| [W3C: tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) requires selection state, associated panels, and keyboard navigation. | Food tools expose tabs and panels. Arrow keys/Home/End move focus; Enter/Space activates. Manual activation avoids automatically starting a lazy-loaded tool during keyboard exploration. |
| [MDN: reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) supports respecting users' motion preference. | Member CSS limits motion, skeletons/spinners animate only where appropriate, and programmatic nutrition scrolling respects reduced motion. Visible focus and a skip link support keyboard use. Phone inputs use 16 pixel text to avoid involuntary input zoom. |
| [Google: optimize INP](https://web.dev/articles/optimize-inp) recommends reducing unnecessary main-thread work and rendering complexity. | On-demand modules reduce initial client work. Tools remain mounted after first use so switching to quick entry preserves drafts. Expensive catalog ranking runs on the server, with a literal-match path and a bounded public-result cache. |

## Bottlenecks found and addressed

The previous page mounted a large nutrition workspace before the meal list, then also displayed a separate manual form. Calculator, pantry and label-scanning code were eagerly connected to the route. A date change replaced the page with a short loading message. Edits and saves required another diary request after the mutation. Searches dispatched Server Actions for each debounced query, sharing the client action queue with mutations.

Nutrition now starts with four summary cards and the meal list, followed by a single logging workspace. Previous/next/Today controls reduce date-picker effort. Switching logging methods preserves the quick-entry and calculator drafts for the current visit. Changing dates intentionally clears meal drafts, matching the existing behavior. Saves use the server's persisted entry; deletes update the displayed list only after confirmation from the server. A late calculated save remains assigned to its original date and cannot insert that meal into the currently selected day.

For scale, official-food searches first check pre-normalized food names and aliases; fuzzy matching remains a fallback for spelling errors. Up to 128 catalog result sets are retained per process. Category and normalized query form the cache key, result limits are applied after lookup, and private label foods are queried separately on every request. This cache is bounded and disposable. GET responses containing member data explicitly use `private, no-store` and authenticate their caller. Pantry initialization now runs independent database reads together and reuses the already-owned personal food records. Overview queries select meal macro fields rather than fetching ingredient snapshots.

## Local measurements

The baseline catalog module was extracted from Git into an ignored local file. Baseline and updated modules were benchmarked in the same Node/tsx process, using ten repeated baseline calls, one initial updated call, and ten cached updated calls per query. These are catalog computation times; they exclude HTTP, authentication, database latency, mobile CPU, and deployment cold starts.

| Query | Baseline average | Updated first lookup | Updated cached average |
| --- | ---: | ---: | ---: |
| chicken | 187.4 ms | 7.6 ms | 0.034 ms |
| brown rice | 460.1 ms | 3.9 ms | 0.021 ms |
| quinoa | 155.3 ms | 1.9 ms | 0.010 ms |
| unknown test term | 796.4 ms | 861.1 ms | 0.014 ms |

Unknown/typo queries still pay the fuzzy-search cost on their first lookup. The optimization does not promise every search becomes instant. The initial production nutrition client-reference manifest listed 414,484 bytes of JavaScript before and 354,772 after; individually gzip-compressed listed chunks totaled 122,104 versus 104,258 bytes, about a 14.6% reduction. This is a build-manifest comparison, not measured browser network transfer, and includes shared framework/auth chunks.

## Validation and next measurements

Unit tests cover food ranking, aliases, typo fallback, ownership, category separation, bounded search results, diary persistence, input validation, and private response headers. Browser regression checks exercise member persistence, calculated meals, pantry preferences, delayed saves across dates, on-demand loading, retained drafts, keyboard tabs, cancelled searches, and responsive navigation. Local browser verification uses the existing Playwright suite and disposable development accounts/database; the in-app browser runtime was unavailable.

Verified locally: production compilation and TypeScript checking pass, targeted ESLint and whitespace checks pass, and all 124 unit tests pass. The final member/nutrition/label-scanning Playwright run passed all 19 checks including auth setup, across desktop, iPhone 13 emulation, and a 320 pixel viewport. Screenshot review confirmed readable date controls, retained branding, and no horizontal overflow. Review captures are retained under ignored `.local/member-experience/`.

A separate final transformation-flow run also passed all four checks including auth setup, verifying the pantry-to-calculator handoff, training preferences, and community interactions across the same three screen sizes.

For a production rollout, measure real-user INP, LCP and CLS at the 75th percentile, split by mobile/desktop, together with authenticated endpoint latency and database query latency. [Google's Web Vitals guidance](https://web.dev/articles/vitals) defines good thresholds as INP at most 200 ms, LCP at most 2.5 seconds, and CLS at most 0.1. These are targets, not results established by the local checks. Avoid sending food searches, meal names, photos or other member content in performance telemetry. First-time fuzzy search, growing diary sizes, database connection limits, and progress-photo storage remain areas to profile with real usage before introducing search services, pagination or storage migrations.

Usability follow-up should ask a few members to log a known meal, calculate an unfamiliar meal, edit yesterday's entry, and find their next workout. Observe completion time, errors and where they hesitate. The choice to default to Quick entry can be adjusted if observed usage favors weighed ingredients.
