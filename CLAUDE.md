# Paris Indoor Soccer (Nuxt rewrite)

League site for an indoor soccer facility that runs several leagues (see "Leagues" under Decisions): schedule/results, standings, playoff bracket, team rosters with player photos. Public pages are read-only; only staff sign in: referees enter scores, admins also manage players.

This is a full rewrite of the React + Express + MongoDB app at `../paris-indoor-soccer` (frontend on Vercel, API on Vercel, images on ImageKit). That repo is the functional reference — read it to see what a page/feature does, but don't copy its structure. Nothing in it is a requirement: features, data shapes, logic and UI are all open to improvement or removal. "The old app did it that way" is never a reason to keep something.

## Stack

| Layer     | Choice                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Runtime   | Node 24 LTS (`.nvmrc`; run `nvm use`). Nuxt 4.5 needs Node ≥ 24.11.                                       |
| Packages  | pnpm 12 (pinned via `packageManager`; build scripts allowlisted in `pnpm-workspace.yaml`)                 |
| Framework | Nuxt 4 / Vue 3.5 / Vite 8 (Vite comes with Nuxt — never add it directly)                                  |
| UI        | Tailwind CSS 4 + DaisyUI 5, system font (Tailwind's default `font-sans`: nothing to download)             |
| Data      | NuxtHub (`@nuxthub/core`) + Drizzle ORM. Cloudflare D1 (dev reaches it over HTTP; SQLite without a token) |
| Files     | NuxtHub blob: Cloudflare R2 (dev: `.data/blob`, or R2 over its S3 API with `S3_*` keys in `.env`)         |
| Auth      | Better Auth via `@nuxtjs/better-auth`, username + password (`username` plugin), `admin` plugin for roles  |
| Lint/fmt  | oxlint + oxfmt (not ESLint/Prettier)                                                                      |
| Hosting   | Cloudflare Workers, deployed from GitHub via Workers Builds                                               |

## Commands

```sh
pnpm dev                 # dev server; applies pending migrations automatically
pnpm db:generate         # generate a migration after editing server/db/schema.ts
pnpm lint                # oxlint
pnpm fmt                 # oxfmt (write); pnpm fmt:check to verify
pnpm typecheck           # nuxt typecheck (vue-tsc) — also type-checks templates
pnpm test                # node --test (test/*.test.ts; plain Node, no Nuxt)
pnpm build:cloudflare    # production build for Workers (NITRO_PRESET=cloudflare_module)
pnpm deploy:cloudflare   # wrangler deploy (migrations reach D1 through pnpm dev, see Decisions)
```

Nitro tasks run through the dev server (the Nuxt CLI has no `task run`):

```sh
curl -X POST localhost:3000/_nitro/tasks/db:seed
curl -X POST localhost:3000/_nitro/tasks/db:create-user \
  -H 'content-type: application/json' \
  -d '{"payload":{"name":"…","username":"first.last","password":"…","role":"admin"}}'   # or "referee"
```

Ad-hoc SQL: `pnpm exec nuxt-db sql "select …"`. Don't run it while `pnpm dev` is running — it rebuilds `.nuxt` and restarts the dev server. On D1 (safe while dev runs): `pnpm exec wrangler d1 execute paris-indoor-soccer-nuxt --remote --command "select …"` (add `--json` for parseable output).

**Dev against the real D1:** with `NUXT_HUB_CLOUDFLARE_ACCOUNT_ID`, `NUXT_HUB_CLOUDFLARE_API_TOKEN` and `NUXT_HUB_CLOUDFLARE_DATABASE_ID` in `.env`, `pnpm dev` uses the `d1-http` driver (see `$development` in `nuxt.config.ts`). The tasks above, sign-in and score edits then read and write production data, and starting dev applies pending migrations to production. Blank the token to go back to `.data/db`. Photos follow the same idea: with `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET=paris-indoor-soccer-nuxt-photos` and `S3_ENDPOINT=https://<account id>.r2.cloudflarestorage.com` (an R2 API token, Object Read & Write on that bucket) in `.env`, dev reads and writes the real bucket through NuxtHub's S3 driver (`aws4fetch`); without them, `.data/blob`. Keep D1 and R2 together (both on or both off), or players end up pointing at photos in the other store. NuxtHub would pick S3 in any build where those keys are set, so `$production` in `nuxt.config.ts` pins the R2 binding (otherwise a local `pnpm build:cloudflare` bakes the keys into `.output`). Each query is an HTTP round trip, so pages load slower than on local SQLite. `patches/drizzle-orm@0.45.3.patch` makes this work: drizzle's `sqlite-proxy` (which `d1-http` uses) ignores `casing` when config is the second argument, so every camelCase column failed. Drop the patch once drizzle fixes it (still present in 0.45.3).

## Layout

- `app/` — pages, components, layouts (Nuxt 4 `app/` dir). `app/auth.config.ts` = Better Auth client plugins. League pages live in `app/pages/[league]/`; `app/pages/index.vue` only redirects. `app/pages/-rosters.vue` is hidden (Nuxt skips files starting with `-`).
- `server/api/` — API routes. `db`, `schema`, `blob`, `ensureBlob`, `requireUserSession`, `serverAuth` are auto-imported.
- `server/db/schema.ts` — app tables. Better Auth tables (`user`, `session`, `account`, `verification`) are generated by the auth module and merged in automatically; don't define them.
- `server/db/migrations/sqlite/` — generated by `pnpm db:generate`; commit them, never hand-edit.
- `server/db/seed/` — match JSON for the `db:seed` task: one 2026/27 schedule per league (`friday-coed-…`, `sunday-women-…`) plus the legacy Friday seasons (see Data migration).
- `patches/` — pnpm patch for drizzle-orm (see "Dev against the real D1").
- `server/tasks/db/` — `seed` and `create-user` Nitro tasks.
- `server/auth.config.ts` — Better Auth server config.
- `test/` — Node tests for pure functions (standings, playoff resolution) against the real 2024/25 season.

## Decisions (and why)

- **SQL over MongoDB.** Owner prefers relational tables. D1 is SQLite, so the schema also runs on Turso if hosting ever changes.
- **Cloudflare over Vercel.** Vite's company (VoidZero) is part of Cloudflare now; D1/R2/Workers on one platform; free tier covers this site.
- **Staff-only auth, built to open up later.** `disableSignUp: true`; accounts come from the `db:create-user` task. Staff sign in with a username (`first.last`, case-insensitive); Better Auth still requires an email, so the task stores `<username>@paris-indoor-soccer.invalid` (nobody types it, nothing is sent). Two roles: `admin` (everything) and `referee` (scores only). The owner sets and manages the passwords; there's no change-password page. Passwords set by the task skip Better Auth's 8-character minimum (it only applies to sign-up and password changes). Future player registration: set `disableSignUp: false` (new users get role `user`), then add a nullable `players.user_id`. Don't add that column until it's needed.
- **Better Auth stays, even with owner-managed passwords.** `nuxt-auth-utils` (own `users` table, sealed-cookie sessions) was considered: about the same amount of code, no fake emails, but no server-side revocation of one person's session and no built-in sign-in rate limit. Kept Better Auth because the deferred team-lead/player accounts (sign-up, real emails, password resets, self-delete) are what it's for. Revisit only if player accounts are dropped for good.
- **Cloudflare Access and the Better Auth dashboard were considered and skipped.** Access (Zero Trust) guards URL paths behind Cloudflare's own login page: the staff controls here are buttons on public pages, it needs real emails, and it can't do the future player sign-up. It's the likely replacement only if player accounts are dropped. The "Let's get you set up" page on better-auth.com is Better Auth Infrastructure, a paid hosted add-on (`@better-auth/infra`, `dash()` plugin), not needed for the app to work. It adds ~60 `/api/auth/dash/*` endpoints that its service calls (so it needs a public URL) with full user management (ban, impersonate, delete, raw adapter access). Revisit once player accounts exist.
- **Protect every write endpoint with** `await requireUserSession(event, { user: { role: "admin" } })` — 401 when signed out, 403 for other roles (verified). Score edits (`PATCH /api/matches/:id`) use `role: ["admin", "referee"]`. The old app only checked "logged in", not role.
- **R2 replaces ImageKit.** No resizing/transforms were used. Nothing converts images on upload, so resize/compress in the browser before uploading (canvas → WebP, ~800px wide).
- **Leagues** (decided 2026-09-28). A league is a day of the week + gender + age group. This season runs two: **Friday night co-ed adults** (the league on the site so far) and **Sunday night adult women's**. A Sunday morning men's over-35 league also exists but is out of scope (only an example: adding a league later should be new rows, not new code). One site with a dropdown to switch league. Players are shared: one person can play in several leagues (one `players` row, one photo). Staff are site-wide: admins and referees work in every league, so roles stay as they are; sign-in stays username + password only (no Google or other providers until the owner says otherwise). Only 2026/27 matters for now; importing old seasons (step 6) is on hold.
  - How it's built: a `leagues` table (`slug`, `name`, `playoff_format`); each season belongs to a league (names unique per league), and teams, matches and rosters hang off seasons, so a player in two leagues has one roster row per league-season. URLs are `/<slug>` and `/<slug>/matches` (`friday-coed`, `sunday-women`; a men's over-35 league would be `sunday-mens-35`), `?season=` stays a query. Season routes take `?league=` (`findSeason(league, season)`, `seasonId(league, season)`); an unknown league or season is a 404.
  - `/` redirects to the `league` cookie (default `friday-coed`, in `useLeagueCookie`). Only the layout writes it, from the validated league in the URL: separate `useCookie` refs for the same name don't see each other's changes (a second writer left the layout's links stale), and validating keeps a mistyped URL from sending `/` to a 404.
  - League picker: a DaisyUI dropdown in the navbar (inside the menu panel on mobile), its button showing the current league and a down chevron (`btn-soft`, same size as Login), from `/api/leagues`, fetched without `await` so the page's own fetch runs alongside. Picking a league keeps the page (Home, Matches) and drops `?season=`. The page component is reused (not remounted) on a league switch; `useFetch` refetches because the league is in its reactive query.
  - Playoff format per league: `playoffFormats` in `server/utils/season.ts` maps `playoff_format` to a function (both leagues `six-team` = `resolvePlayoffs`). To change one league's format, add a function and switch only that league's value.
  - Downloads will be per league (`/<slug>/downloads`).
- **Players change teams every season.** `players` is the person; `rosters` (season, player → team) says which team they were on, with one team per player per season enforced by the primary key. A team exists per season (captain name + jersey color). The newest season (by name) is the current one; there's no flag to keep in sync. Season ids are only row numbers (they differ between local SQLite and D1): pages link by name, `?season=2026-2027`.
- **Player admin lives on the Rosters page** (one dialog for add and edit). Adding can pick a returning player (anyone not on a team that season) instead of typing a new name. "Remove" takes a player off one season; a player left with no seasons is deleted with their photo. Photos are one per person, stored under a random key (`players/photo-xxxx.webp`) and served by `/photos/**` with a year-long immutable cache. The browser resizes to 800px WebP; Safari can't encode WebP, so it sends JPEG.
- **Playoff placeholders.** Playoff games are scheduled before teams are known: `home_team_id`/`away_team_id` are null and `home_slot`/`away_slot` hold labels like `3rd`, `Highest seed`, `Finals`. They're computed, not assigned: `resolvePlayoffs` in `server/utils/season.ts` fills them once every regular-season game has a score. Quarterfinal winners are re-ranked, so 1st plays the lower-ranked winner ("Lowest Seed"). That matches the real 2024/25 bracket; the old app's `updatePlayoffTeams` hard-coded it wrongly.
- **Dates are local wall-clock text** (`2025-10-24T19:30:00`, no offset). Workers run in UTC — don't round-trip through `Date` on the server. Format for display with `Intl.DateTimeFormat` (moment is gone). "Today" uses the league's timezone (`America/Toronto`) so the server and browser agree on the current match day.
- **Only NuxtHub applies migrations, never `wrangler d1 migrations apply`.** Both record them in `_hub_migrations`, but NuxtHub stores `0000_name` and wrangler looks for `0000_name.sql`, so wrangler re-runs migrations NuxtHub already applied (the first Workers deploy failed with "table `account` already exists"). A migration reaches D1 when `pnpm dev` starts against D1: do that before pushing code that needs it.
- **TypeScript is pinned to 6.x.** TS 7 (the Go-native compiler) has no JS API, and NuxtHub's schema build (rolldown-plugin-dts) breaks with it. Revisit when the ecosystem supports TS 7.
- **oxlint + oxfmt, not ESLint/Prettier.** Oxlint does not lint Vue `<template>` blocks yet; `nuxt typecheck` covers template type errors. Don't add ESLint to fill the gap. shadcn/lint was considered and skipped (can't see templates under Oxlint; DaisyUI components are classes, not Vue components).
- **Styling rule:** use DaisyUI components and semantic theme colors (`primary`, `base-100`, `base-content`, …), not raw Tailwind palette colors (`red-500`) or arbitrary values (`p-[13px]`).
- **Look** (from the owner's reference mockup `example_ui.webp`, kept untracked in the repo root): a grey page (`bg-base-200` on `<html>`, set in the layout's `useHead`), white `bg-base-100` cards with `shadow-xl`, black `btn-neutral` for primary actions, no divider lines (the one exception so far: DaisyUI `list` draws faint lines between match rows, and the owner kept them). Small square controls (Edit button, scroll-to-top, toast) are rounded squares with `rounded-lg` (8px): light and dark round fields and boxes by 1.5–2rem, so `btn-square` alone draws a circle. Home is the template: finish a page there, then copy the style to the others. **One layout at every width** (decided 2026-09-28): the owner didn't like the separate desktop design (side menu, standings and match day side by side), so desktop shows the mobile layout, 11/12 of the screen wide (`md:w-11/12` in the layout). Desktop (`md:`) only changes sizes, never the arrangement: larger text (logo `md:text-2xl`, tabs `md:text-lg`, Home below) and team names in the table. Use Tailwind/DaisyUI responsive classes only (`md:` variants, DaisyUI size classes), no computed sizes.
  - Navbar: logo left. Desktop: league picker, theme picker and Login on the right. Mobile: a menu button that opens a panel below it with the same three, stacked (picking a league closes it).
  - The page links are a centered row of tabs between the navbar and the content that scrolls sideways once it's wider than the screen (`justify-center-safe`: plain `justify-center` would push the first tab out of reach) (active = black `bg-neutral` pill, others `text-base-content/30`; `NuxtLink` sets `aria-current="page"`), deliberately not in the navbar. The navbar and the tabs stick together (decided 2026-09-28) in one full-width sticky bar (`sticky top-0 z-20 bg-base-200`, with the `md:w-11/12` container inside it; `<main>` repeats the container classes): inside the padded container, the bar's grey stopped short of the screen edges and card shadows showed beside it. The tabs have `pb-2` so the active pill doesn't touch the bar's bottom edge; `<main>` has `pt-4` (so the unscrolled spacing stayed 24px) and bottom padding so the last card doesn't touch the screen edge. The stuck bar is 124px tall on phones, 132px on desktop: anything that scrolls to an anchor needs `scroll-mt-36` (Matches' day cards do). `header` has `relative` so the mobile menu panel hangs below the navbar (not below the tabs); the toast is `z-30`, above the bar.
- **Home:** the match-day card sits above the standings card ("Table") (swapped 2026-09-28, in the code too), `gap-6` apart. The match card has `mt-8` so the black date square (it rises 32px above the card) stays 24px below the tabs. Filling the screen height (cards stretching to the bottom) was tried and rejected. On phones the table shows shirts only (team names from `md:` up), 12px text, stats centered, headers the same size and color as the data at weight 500 (PTS values 600); it fits at 360px wide without sideways scrolling. Below the match list, a 4px DaisyUI `progress` (`h-1`) shows the selected match day out of all match days, playoffs included (28 per league this season). Desktop sizes: "Table" `md:text-3xl`, table `md:text-lg` with `md:table-md` padding, season select `md:select-md`, match list `md:text-lg` (on the `ul`: DaisyUI `list` sets its own 0.875rem, so a size on the card body no longer reaches the rows), date `md:text-3xl`.
- **Match rows are a DaisyUI `list`** (`MatchRow` is the `li.list-row`; Home and Matches wrap them in `<ul class="list">`; decided 2026-09-28). Three columns: the start time (thin, faded, `tabular-nums`), the match (DaisyUI grows the second column by default, so no `list-col-grow`), and for staff an Edit pencil button (`btn-square btn-sm rounded-lg`). The middle shows the score when played, a faded "vs" when not. Phones show shirts only, names from `md:` up (like the table); playoff placeholders ("Highest seed", "Finals") have no shirt, so their label always shows, and those rows wrap at phone width (74px, up to 116px for staff at 360px; shorter labels in the schedule data would fix it). Regular rows are 60px on phones (64 for staff), 68px on desktop. The edit dialog shows each team's shirt beside its score input.
- **Matches page:** a 4px `progress` under the header shows match days before today out of all match days (playoffs included, ignores the team filter; empty until the first match day). The team filter tabs are centered and scroll sideways like the page tabs (`flex-nowrap justify-center-safe overflow-x-auto`; DaisyUI `tabs` wrap by default). A fixed scroll-to-top button (`btn-neutral btn-square rounded-lg`, bottom-right, always visible) scrolls smoothly to the top. Still to restyle to the Home look (step 8).
- **Toast:** one page-wide DaisyUI toast in the layout (`toast-top toast-center`, `alert-success rounded-lg`, 3 seconds), driven by `useState("toast")`. So far only `MatchRow` sets it ("Match updated", after a save and `refreshNuxtData()`). It lives in the layout because a date change moves the match to another day, which unmounts its row. Set the same state for future messages.
- **Themes keep DaisyUI's own colors.** `main.css` only changes shape on light and dark: pill radii and `--depth: 0` (flat, no component shadows). All other themes are untouched. The owner wants all 35 themes kept: the picker needs a better design, not fewer themes.
- **Icons are inline SVG paths** (chevrons, including the down chevron that marks the league and theme buttons as dropdowns and the up chevron on scroll-to-top, menu button, the Edit pencil from Lucide, ISC license); DaisyUI and Vue ship none. Switch to `@nuxt/icon` once more icons are needed, with a bundled icon set (e.g. `@iconify-json/lucide`) rather than runtime fetches from Iconify. The logo icon is the ⚽ emoji: the old app's `parisindoorsoccerlogo.svg` is a Vexels stock image ("All Rights Reserved"), so don't reuse it.
- **Dates display short** (`Oct 16`, `formatDate` in `app/utils/dates.ts`, shared by Home and Matches): a league plays on one weekday (Friday, Sunday), so the weekday adds nothing.
- **System font, no web font.** Poppins was dropped (the owner didn't like it, and its four weights were four downloads that swapped in after first paint). Pages use Tailwind's default `font-sans` (San Francisco on iPhone, Roboto on Android): nothing to download, no font swap. If a brand font is ever wanted, use one variable font (one file for every weight) via `@fontsource-variable/<name>`.
- **Page data stays cached between tab switches** (`getCachedData` in `useSeason`): a revisited page (or season) renders its last data at once and refreshes in the background. By default Nuxt 4 drops a page's data when leaving it, so every tab switch waited ~250ms on the server in dev. Consequence: pages must reset selections (Home's match day, Rosters' team) by watching `data.value?.season.id`, not `data`, or the background refresh (and `refreshNuxtData()` after a save) resets them.
- **Season routes make one database round trip.** `seasonId(league, season)` in `server/utils/findSeason.ts` is the season id as a subquery, so a route's queries go in the same `Promise.all` as `findSeason` instead of waiting for it (dev API time went from ~170ms to ~95ms). Use it in any new season route.
- **Code style** (enforced by oxfmt): tabs, double quotes, semicolons, 300-char lines, objects collapsed onto one line (owner prefers long single lines over wrapped blocks).

## Conventions

- **Minimal code.** Use the fewest lines, components and classes that achieve the goal. No helpers, wrapper components or abstractions for one-off use. No classes that don't change the result (e.g. values DaisyUI already sets).
- **Commit messages:** `type: short summary`, a blank line, then one short bullet per change. Types: `feat`, `fix`, `perf`, `refactor`, `style`, `test`, `docs`, `chore`.

  ```
  feat: add theme picker to navbar

  - Dropdown lists all DaisyUI themes with color previews
  - Choice saved in a `theme` cookie and rendered server-side
  ```

- **Goal:** simple, maintainable code with the best performance. The guidelines below serve that; worked examples are in `EXAMPLES.md`.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Data migration from the old app

- **`db:seed` only loads 2026/27**, one file per league in the `leagues` list in `server/tasks/db/seed.ts`: `friday-coed-2026-2027.json` (built from the league's schedule, same shape as the legacy files) and `sunday-women-2026-2027.json` (placeholder: Friday's schedule moved to the Sunday after, Team 1–6, codes `sw…`). To replace the Sunday placeholder with the real schedule: on D1, delete that league's matches, then its teams (`… where season_id = (select s.id from seasons s join leagues l on l.id = s.league_id where l.slug = 'sunday-women')`); swap the JSON; re-run `db:seed`. To migrate an older Friday season, import its file into the Friday entry again.
- `matches-2024-2025.json` / `matches-2025-2026.json` are copies of the old repo's `backend/config/matchData-*.json`. 2024/25 has final scores (the tests use it). **2025/26 has no scores in the JSON** — the real results live only in MongoDB.
- A `mongoexport --collection matches --jsonArray` has the same shape as those files. Drop it into `server/db/seed/` and re-run `db:seed`; the task upserts by match code.
- **Team colours** are CSS colour names. `TeamShirt` outlines every shirt in `base-content`, so `White` shows on light and dark themes. Adam's team is really White: the legacy files say `Grey` (a visibility workaround), so change that on import. The seed upserts teams by (season, colour), so changing a colour on a seeded team means `update teams set color = …` on D1 plus editing the JSON. Re-seeding with only the JSON changed adds a duplicate team.
- **Players exist only in MongoDB** (`rosterData.js` in the old repo is mock data). They need an export plus an import step, and photos must be re-uploaded from ImageKit to R2. Players have no season in Mongo — their team assignment per season must be decided on import.

## Deployment (live at https://parisindoorsoccer.ca; also still at https://paris-indoor-soccer-nuxt.nicholasjacarvalho.workers.dev)

1. ~~Create the GitHub repo and push.~~ Done: https://github.com/carvnich/paris-indoor-soccer-nuxt
2. ~~`wrangler login`, `wrangler d1 create`~~ Done: D1 `paris-indoor-soccer-nuxt` (ENAM), id `1d55e784-eeac-46ca-8988-197983ccc9fa`, migrations applied and 2026/27 seeded. R2 bucket `paris-indoor-soccer-nuxt-photos` (ENAM) created.
3. In the Cloudflare dashboard: Workers → Create → Import a repository. Build command `pnpm build:cloudflare`, deploy command `pnpm deploy:cloudflare`. No build variables: the D1 id is in `$production` in `nuxt.config.ts` (a missing build variable once left the binding out of `wrangler.json`).
4. Worker secrets: `NUXT_BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `NUXT_PUBLIC_SITE_URL=https://<domain>`. Type Secret, not Text: `wrangler deploy` removes dashboard Text variables that aren't in the config. The site URL must be exact (no quotes, spaces or trailing slash): a bad value made every auth request 500 with "Invalid siteUrl" in `wrangler tail`, which the browser showed as `NUXT_E1005` plus a hydration mismatch. It was set with `printf '%s' "https://…" | pnpm exec wrangler secret put NUXT_PUBLIC_SITE_URL --name paris-indoor-soccer-nuxt` (no redeploy needed). Since 2026-09-28 it's `https://parisindoorsoccer.ca`, so sign-in on the `workers.dev` URL fails with 403 `INVALID_ORIGIN` (public pages there still load). To test that with curl, send a `Cookie` header too: Better Auth skips the origin check on requests without cookies.
5. Load production data: point dev at the real D1 (see Commands), run `pnpm dev` (applies the migrations), then run the `db:seed` and `db:create-user` tasks. Seed done (2026/27); staff accounts created (admins `nicholas.carvalho`, `kurtis.cruickshank`; referees `mike.bijman`, `claire.osmon`). An account created this way signs in on the Worker too (the password hash doesn't depend on `NUXT_BETTER_AUTH_SECRET`). The build output was also verified end to end on workerd against a local D1 (`wrangler d1 … --local --persist-to <dir>`, then `wrangler dev --config .output/server/wrangler.json --persist-to <dir>`).
6. ~~Custom domain~~ Done 2026-09-28: `parisindoorsoccer.ca`, bought through Cloudflare Registrar in the same account (so its DNS zone is already on Cloudflare). The owner attached it in the dashboard (Worker → Settings → Domains & Routes → Custom domain), which created the `Worker` DNS record and a certificate (Google Trust Services, auto-renewed). It isn't in `nuxt.config.ts`; if a deploy ever drops it, add `routes: [{ pattern: "parisindoorsoccer.ca", custom_domain: true }]` to `nitro.cloudflare.wrangler`. Still to do, owner deferred:
   - `www` doesn't resolve. Add a DNS `AAAA` record `www` → `100::`, Proxied, then Rules → Templates → "Redirect from WWW to root". Redirect rather than a second custom domain: sign-in only works on the exact `NUXT_PUBLIC_SITE_URL`.
   - The site sends no email, so publish "no mail from this domain" records against spoofing: TXT `@` = `v=spf1 -all`, TXT `_dmarc` = `v=DMARC1; p=reject;` (change them if the owner ever wants `@parisindoorsoccer.ca` addresses, e.g. Cloudflare Email Routing).
   - After a while on the new domain: turn off `workers.dev` (`workers_dev: false` in `nitro.cloudflare.wrangler`, or the toggle under Domains & Routes) and retire both Vercel projects.

Push to `main` deploys (Workers Builds, usually about 1.5 minutes, once 4; logs under the Worker's Deployments tab, runtime errors with `pnpm exec wrangler tail paris-indoor-soccer-nuxt`). Schema changes need one extra step: start `pnpm dev` against D1 once before pushing (see "Only NuxtHub applies migrations"). Preview builds would give branches their own URLs, but they'd share the production D1 and R2; leave them off unless they're needed. Sign-in on a preview URL fails: Better Auth only trusts `NUXT_PUBLIC_SITE_URL` as an origin. Add `trustedOrigins` only if admin testing on previews turns out to be needed.

## Progress

1. [x] Scaffold: Nuxt 4, DaisyUI, NuxtHub (db + blob), Better Auth, oxlint/oxfmt, schema + first migration, seed + create-admin tasks. Verified: seed is re-runnable, sign-up blocked, admin guard 401/403/200, Cloudflare build + `wrangler deploy --dry-run` (488 KB gzip).
2. [x] Layout + navbar (`app/layouts/default.vue`); all DaisyUI themes + navbar picker with color previews (`theme` cookie rendered server-side; "System" = light/dark from OS)
3. [x] Public pages: Home (match day + standings), Matches (team filter), Rosters (empty until players are imported); all three have a season select and a styled 404 page. Pages default to the newest season. D1 only has 2026/27 (no scores yet); to see scored data, point dev back at local SQLite with 2024/25 seeded.
   - [x] Full-codebase review applied: matches index, parallel queries, `findSeason` + `useSeason` shared by the season routes/pages, one navbar menu for desktop and mobile, league timezone for "today", node tests (`pnpm test`), `objectWrap: "collapse"`. Still to eyeball in a browser: navbar at mobile width and the error page.
4. [x] Login page (`/login`, `auth: "guest"`, honours `?redirect=`) + `PATCH /api/matches/:id` (admin; score + start time, both scores empty = not played). Admins get an Edit button on every `MatchRow` (Home and Matches) that opens a dialog, then `refreshNuxtData()` so standings/playoffs recompute. Verified: 401/403/400/404/200 via curl, login + edit + sign-out in headless Chromium, and the same on workerd + local D1 (Deployment step 5).
   - [x] Better Auth over D1 verified (create admin, sign in, admin session, score write), after the drizzle casing patch.
   - [x] Staff accounts: username sign-in, `referee` role (scores only), `db:create-user`; four accounts on D1. Verified on local SQLite (sign-in, 401/403 by role) and on D1 + R2 in headless Chromium (referee sees score Edit but no roster controls; an admin's photo upload lands in R2 as 800px WebP and is deleted from R2 on remove).
5. [x] Players: add/edit/remove on the Rosters page, returning players, photo upload to blob (client-side resize). Verified against local SQLite + fs blob: 401/400/404 via curl, photo replace/remove deletes the old file, and add (1024px JPEG → 800px WebP) / edit / move team / remove in headless Chromium.
6. [ ] Import real data from MongoDB (25/26 results, players, photos), then drop `matches.code` (it only exists to match legacy rows on import). **On hold (2026-09-28):** the owner is focusing on 2026/27 only.
7. [ ] Cloudflare deploy (steps above) + custom domain.
   - [x] D1 created, `pnpm dev` runs against it (`d1-http`), migrations applied, 2026/27 season seeded (6 teams, 75 regular + 5 playoff games, Oct 16 2026 → May 14 2027). The 7:30 "Drop-In" on finals night was left out (not a league game).
   - [x] R2 bucket created.
   - [x] Workers Builds import, Worker secrets, first deploy (2026-09-25). Two failed deploys first: no D1 binding (fixed by the id in `nuxt.config.ts`), then wrangler re-running migrations (fixed by dropping it from `deploy:cloudflare`). Verified live: all pages 200 with no console errors at 390px, session 200, signed-out PATCH 401, wrong password rejected, and the owner signed in with their staff account.
   - [x] Custom domain `parisindoorsoccer.ca` (2026-09-28), `NUXT_PUBLIC_SITE_URL` switched to it. Verified: `/` → `/friday-coed` 200, `/api/leagues` and the session endpoint 200, valid certificate; sign-in accepts the new origin and rejects `workers.dev` (403 `INVALID_ORIGIN`).
   - [ ] `www` redirect, anti-spoofing email records, turn off `workers.dev`, retire the Vercel projects (Deployment step 6).
8. [ ] UI redesign (see "Look" under Decisions).
   - [x] Layout (grey page, padded navbar, side menu) and Home on desktop (large standings table; fixed-width match-day card with an overlapping black date square). Replaced on 2026-09-28 by the mobile layout at every width (below).
   - [x] Mobile navbar, menu panel and tab row; Home on mobile (see "Home" under Decisions). Committed in `0c4cce7`.
   - [x] Performance pass: cached page data across tabs, one round trip per season route, system font instead of Poppins (see Decisions). Revisiting a tab went from ~245ms to ~50ms in dev. Ideas found but not applied are listed under "Next session".
   - [ ] Tab row scrollbar: the layout uses `scrollbar-none`, which neither Tailwind 4 nor `main.css` defines, so desktop browsers show a scrollbar once the tabs overflow (not with today's three tabs). The Matches team filter uses it too, and does overflow at 360px (phones use overlay scrollbars, so nothing shows there). Fix: `@utility scrollbar-none { scrollbar-width: none; }` in `main.css`.
   - [ ] Bring Matches and Login to the Home style, phone sizes plus the `md:` text sizes (Rosters waits, see step 9) (they still have an earlier pill-tab/card restyle). `MatchRow` is shared, so Matches already has the list rows; it also has its progress bar, centered team filter and scroll-to-top button (see "Matches page" under Decisions).
   - [ ] Downloads page, per league (`app/pages/[league]/downloads.vue`; visitors download files). The menu link exists; `/<league>/downloads` 404s until the page does, and the dev log warns "No match found for location with path /friday-coed/downloads".
   - [x] Desktop mirrors mobile (2026-09-28): side menu and side-by-side Home dropped, league picker moved to the navbar, bottom padding under the content. Verified in Chromium at 360/390/1280px: no overflow, picker works in the navbar and the mobile menu, no console errors. Then 11/12 width on desktop, larger desktop text (navbar logo, tabs, all of Home) and team names in the table from `md:` up; phone sizes unchanged, no overflow at 390/768/1280px. Then centered tabs (still scroll at 230px, first tab reachable), the league picker as a soft dropdown button, and down chevrons on the league and theme buttons.
   - [x] Match day UI (2026-09-28, see "Match rows", "Home", "Matches page" and "Toast" under Decisions): match rows as a DaisyUI list (shirts only on phones, rounded-square Edit), progress bars on Home and Matches, "Match updated" toast, match card above the Table on Home, centered team filter, scroll-to-top on Matches, navbar + tabs in one full-width sticky bar, shirts beside the score inputs in the edit dialog. Verified in Chromium at 360/375/390/768/1280px: no page overflow, no console errors besides the Downloads 404 warning, progress 1/28 → 28/28 on Home in both leagues, tabs stuck with the grey covering the full width, day jumps clear of the bar, menu panel over the tabs, edit dialog fits at 360px (with a fake staff user set in the browser, see Session gotchas). The toast was checked by setting its state, not with a real save.
   - [ ] Then, in order: page titles + favicon, a better theme picker (all themes), playoff bracket.
9. [ ] Multiple leagues (the owner's priority for the week of 2026-09-28). How it's built is under "Leagues" in Decisions.
   - [x] Rosters hidden until Home, Matches, Downloads and Login are production-ready (`-rosters.vue`, menu link removed; the players/rosters API routes stay, admin-only and unused meanwhile, `/api/rosters` already takes `?league=`).
   - [x] Schema + migration `0004`, seed for both leagues (Sunday = placeholder, see Data migration), league-aware season routes + `/api/leagues`, pages under `[league]`, league picker, `/` redirect by cookie, `playoffFormats`. Verified on local SQLite: seed re-runnable (2 leagues, 2 seasons, 12 teams, 160 matches), API 200/404 per league and season, Sunday bracket seeds resolve from temporary scores, local admin score edit on a Sunday match updates its standings (signed out 401); in Chromium at 360/390px: `/` → `/friday-coed` then the cookie's league, the picker keeps the page, Login links to the cookie's league, `/nope` and `/rosters` 404, no page overflow, no hydration warnings. `pnpm test`/`lint`/`fmt:check`/`typecheck` pass. On workerd + a local D1 built from migrations 0000–0003: 0004 fails while `seasons` has a row ("Cannot add a NOT NULL column with default value NULL") and applies once the tables are cleared; the built Worker then serves both leagues (200), 404s and the `/` redirect.
   - [x] **Production D1 (2026-09-28, owner approved):** cleared the app tables (1 season, 6 teams, 80 unscored matches, no players; the 4 staff accounts untouched), then started dev against D1 (applied 0004), then `db:seed`. D1 now: 2 leagues, 2 seasons, 12 teams, 160 matches, 4 users, migrations 0000–0004. (The clear had to come first: 0004 can't add `league_id` while `seasons` has rows.)
   - [x] Verified live after the push (`97fd555`): `/` → `/friday-coed`, and → `/sunday-women` with that cookie; switching league on Matches keeps the page with the other league's data; `/nope`, `/rosters` and `?season=1999-2000` 404; no page overflow at 360/390px; no console errors besides those 404s; session 200, signed-out PATCH 401.

### Next session

- **Next up:** the real Sunday schedule when the owner sends it (Data migration explains the swap). After that, step 8 (Matches, Downloads and Login in the Home style); Rosters stays hidden until those are production-ready. The site is live on https://parisindoorsoccer.ca (the rest of the domain setup is in Deployment step 6). Step 6 of Progress is on hold.
- **Owner reviews UI changes themselves** on their running dev server (HMR picks up edits) and reports back; don't take screenshots to check styling unless asked. To check fit (overflow, row heights, font sizes), measure in Playwright instead: `scrollWidth` vs `clientWidth`, `offsetHeight`, `getComputedStyle`, at 360/375/390px wide, plus 768px (the narrowest desktop) and 1280px. These checks live in throwaway scripts in `/tmp/pw`; the site's code never computes sizes (see "Look").
- **The owner edits the same files by hand between requests.** Re-read a file before editing it, and treat their edits as the current state.
- **Open from 2026-09-28:** in `MatchRow` the score is `text-xl` but "vs" is `text-sm` (the owner's edit), so an unplayed row grows 8px when a score is entered, and the comment above it ("Score and 'vs' share a size…") is out of date. Asked the owner whether to match the line heights (`text-sm/7` on "vs") or fix the comment; no answer yet.
- **Tokens rotated (2026-09-25):** the D1 API token (`paris-indoor-soccer-d1-dev`) and the R2 keys (`paris-indoor-soccer-nuxt-dev`), after both showed up in session transcripts. The new values are only in `.env`; the Worker uses bindings and needs neither.
- **Performance ideas not applied** (small, or need the owner's call):
  - Better Auth `session.cookieCache`: skips a D1 session lookup on every page load for signed-in staff; revoking a session or changing a role then takes up to the cache age.
  - `POST /api/players`: the team and existing-player lookups run one after the other, and the old-photo delete waits for the roster write; both pairs could run together. Admin-only, untested because dev writes to production.
  - Theme picker: all 36 themes render (each with its own `data-theme` scope) on every page while closed. Render them only when open, as part of the picker redesign.
  - `/api/rosters` sends every player from every season; only admins need the others (returning players). Tiny now; grows each season.
  - Each `MatchRow` renders its own edit dialog for staff (~80 on Matches); one shared dialog would cut that.
  - `adminClient()` in `app/auth.config.ts` isn't used by client code (~1KB gzip of ~88KB JS); check `user.role` still types without it.
  - Photos: a public R2 custom domain would serve first views from Cloudflare's cache instead of the Worker (browsers already cache them for a year).
- **Dev is slower than production:** D1 over HTTP from the laptop (~80ms a query), page modules loaded on first visit, devtools. Judge speed on the deployed site.
- **Later (owner deferred):** team-lead and player accounts. Sketch: team lead = `teams.lead_user_id` per season (not a role); players link via nullable `players.user_id`; open sign-up with real emails needs an email service for password resets.

### Session gotchas

- Every command needs `source ~/.nvm/nvm.sh && nvm use` first (the default Homebrew Node is too old for Nuxt 4.5).
- Only one `pnpm dev` can run; a stale one blocks with "Another Nuxt dev is already running" (kill its PID). `NUXT_IGNORE_LOCK=1` lets `pnpm build:cloudflare` run alongside it, but see the next point. `pkill -f "nuxt dev"` doesn't match the process (it's `nuxt.mjs dev`); use `pkill -f "nuxt.mjs dev"`.
- **Builds, typecheck and installs rewrite the dev server's database module.** NuxtHub generates `node_modules/@nuxthub/db/db.mjs` for whatever ran last: `pnpm build:cloudflare` writes the D1-binding version, `pnpm typecheck` and `pnpm add/remove` (postinstall) the local SQLite (`libsql`) one; dev needs `sqlite-proxy` (d1-http). A running dev server picks the file up on its next server reload, e.g. after editing a `server/` file, and then fails with 500 "[nuxt-hub] DB binding not found" (or silently uses local SQLite). Fix: `touch nuxt.config.ts` (dev restarts and regenerates it), then check `head -1 node_modules/@nuxthub/db/db.mjs` shows `sqlite-proxy`.
- **Dev writes to production.** With the token and `S3_*` keys in `.env`, tasks, test sign-ins, score edits and photo uploads hit the live D1 and R2. Use the real staff accounts for testing, delete their test sessions afterwards (`delete from session`), remove test players through the UI (that deletes their photo from R2), and put back any scores you changed. Check R2 with `pnpm exec wrangler r2 object get paris-indoor-soccer-nuxt-photos/<key> --remote --file /tmp/x`.
- **Local dev without editing `.env`:** blanking the token in the shell doesn't work (Nuxt loads `.env` over blank shell vars, so dev still hits D1 and R2). Instead run `pnpm dev --dotenv /tmp/local-dev.env`, a file with only `NUXT_BETTER_AUTH_SECRET` and `NUXT_PUBLIC_SITE_URL=http://localhost:3000` (recreate it if `/tmp` was cleared): that gives `.data/db` + `.data/blob`. Local data (since 2026-09-28): both leagues' 2026/27 from `db:seed`, no scores, no players (the app tables were cleared for migration 0004, so the old 2024/25 copy and test players are gone), admin `local.admin` / `localpass`. For scored data, add `matches-2024-2025.json` to the Friday entry in the seed task temporarily.
- `--depth: 0` (see Themes) also removes DaisyUI's own shadows, e.g. the active tab in `tabs-box`; add `shadow-*` where one is wanted.
- DaisyUI tables: size classes (`table-xs`, …) only resize body rows; `thead` stays 0.875rem at 60% opacity. `table-xs` rows are 11px, which no Tailwind size matches, so Home sets `text-xs` on both header and rows (`md:text-lg` on both for desktop). Tailwind text utilities beat DaisyUI's table font sizes, and `md:table-md` next to `table-xs` switches only the cell padding at `md:`. The browser makes `<th>` bold, which overrides a weight set on `thead`; set it on the cells (`*:font-medium` on the header `<tr>`).
- A class on a component lands on its root element: Home's `<SeasonSelect class="md:select-md">` resizes only Home's season select, not the one on Matches. Use that for one-page tweaks to a shared component.
- DaisyUI `menu` items wrap to the menu's width: without `w-max` on the `dropdown-content`, "Sunday Women's" wraps onto two lines at 360px.
- Making `<main>` a flex column shrinks page roots that use `mx-auto max-w-*` (the Login card went to 222px); they'd need `w-full`.
- Measuring right after an edit can catch the old CSS: the dev server rebuilds CSS for new classes a moment later. Re-run the measurement if numbers look off.
- Browser checks: `npm i playwright` in a scratch dir outside the repo works (`/tmp/pw` has it; run scripts from there, or relative screenshot paths land in the repo) (Chromium is already in `~/Library/Caches/ms-playwright`). Wait for `networkidle` before clicking, or the form submits before hydration. Set the `theme` cookie to screenshot a specific theme. After signing in, wait for the "Sign out" text, not `waitForURL("**/matches")` (that also matches `/login?redirect=/matches`). After switching league or season, wait for the new data (a fixed wait or its request), not `networkidle`: the page isn't remounted, and the refetch can start after `networkidle` already resolved.
- **Staff UI without signing in** (dev writes to production, so avoid test sign-ins): in Playwright, `document.querySelector("#__nuxt").__vue_app__.$nuxt.payload.state["$sauth:user"] = { id: "x", name: "Test", role: "admin" }` makes the Edit buttons and dialogs render (browser only; a save would still get 401). Any `useState` key works the same way with a `$s` prefix, e.g. `"$stoast"` to show the toast.
- pnpm 12 has no `-s` flag (`pnpm -s lint` fails with "unexpected argument"); pipe through `tail` instead.
- DaisyUI `list` sets `font-size: .875rem` on itself, so a text size on a parent doesn't reach the rows; put `md:text-lg` on the `ul`. `.list-row` has no `align-items`, so add `items-center`. `.modal` is `position: fixed`, so the edit dialog can sit inside the `li` without taking a grid column.
- **Local D1 dry runs:** after `pnpm build:cloudflare`, `pnpm exec wrangler d1 execute DB --config .output/server/wrangler.json --local --persist-to /tmp/d1test --file <migration>` (by binding `DB`; the database name isn't found with that config). Replay `server/db/migrations/sqlite/*.sql` in order, then copy data from `.data/db/sqlite.db` with one `.dump --data-only <table>` per table in foreign-key order (`leagues seasons teams matches`): a single `.dump` lists tables in creation order and fails on foreign keys. Serve with `wrangler dev --config .output/server/wrangler.json --persist-to /tmp/d1test --port 8799`. Stop dev before building (the build rewrites its database module).
- `nuxt typecheck` "Excessive stack depth" (TS2321) on a typed `$fetch`: happens when its promise is passed to a callback typed `() => Promise<unknown>` (use `() => unknown`) or the URL template contains a possibly-undefined value (use `!`).
- `ensureBlob` errors carry `message`, not `statusMessage`; the Rosters dialog reads `e.data.message`.
- "pnpm is running through Node.js because the script that installs its native binary was skipped" is harmless (it's about how pnpm itself was installed).
- `curl` gets JSON error bodies; add `-H "Accept: text/html"` to see the rendered error page.
- `pnpm db:generate` after schema edits; the dev server applies migrations on start (restart it).
- Git pushes as carvnich over the `github-personal` SSH alias; a plain `git push` works.
