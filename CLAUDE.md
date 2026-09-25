# Paris Indoor Soccer (Nuxt rewrite)

League site for an indoor soccer league: schedule/results, standings, playoff bracket, team rosters with player photos. Public pages are read-only; only staff sign in: referees enter scores, admins also manage players.

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

- `app/` — pages, components, layouts (Nuxt 4 `app/` dir). `app/auth.config.ts` = Better Auth client plugins.
- `server/api/` — API routes. `db`, `schema`, `blob`, `ensureBlob`, `requireUserSession`, `serverAuth` are auto-imported.
- `server/db/schema.ts` — app tables. Better Auth tables (`user`, `session`, `account`, `verification`) are generated by the auth module and merged in automatically; don't define them.
- `server/db/migrations/sqlite/` — generated by `pnpm db:generate`; commit them, never hand-edit.
- `server/db/seed/` — match JSON for the `db:seed` task: the 2026/27 schedule plus the legacy seasons (see Data migration).
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
- **Players change teams every season.** `players` is the person; `rosters` (season, player → team) says which team they were on, with one team per player per season enforced by the primary key. A team exists per season (captain name + jersey color). The newest season (by name) is the current one; there's no flag to keep in sync. Season ids are only row numbers (they differ between local SQLite and D1): pages link by name, `?season=2026-2027`.
- **Player admin lives on the Rosters page** (one dialog for add and edit). Adding can pick a returning player (anyone not on a team that season) instead of typing a new name. "Remove" takes a player off one season; a player left with no seasons is deleted with their photo. Photos are one per person, stored under a random key (`players/photo-xxxx.webp`) and served by `/photos/**` with a year-long immutable cache. The browser resizes to 800px WebP; Safari can't encode WebP, so it sends JPEG.
- **Playoff placeholders.** Playoff games are scheduled before teams are known: `home_team_id`/`away_team_id` are null and `home_slot`/`away_slot` hold labels like `3rd`, `Highest seed`, `Finals`. They're computed, not assigned: `resolvePlayoffs` in `server/utils/season.ts` fills them once every regular-season game has a score. Quarterfinal winners are re-ranked, so 1st plays the lower-ranked winner ("Lowest Seed"). That matches the real 2024/25 bracket; the old app's `updatePlayoffTeams` hard-coded it wrongly.
- **Dates are local wall-clock text** (`2025-10-24T19:30:00`, no offset). Workers run in UTC — don't round-trip through `Date` on the server. Format for display with `Intl.DateTimeFormat` (moment is gone). "Today" uses the league's timezone (`America/Toronto`) so the server and browser agree on the current match day.
- **Only NuxtHub applies migrations, never `wrangler d1 migrations apply`.** Both record them in `_hub_migrations`, but NuxtHub stores `0000_name` and wrangler looks for `0000_name.sql`, so wrangler re-runs migrations NuxtHub already applied (the first Workers deploy failed with "table `account` already exists"). A migration reaches D1 when `pnpm dev` starts against D1: do that before pushing code that needs it.
- **TypeScript is pinned to 6.x.** TS 7 (the Go-native compiler) has no JS API, and NuxtHub's schema build (rolldown-plugin-dts) breaks with it. Revisit when the ecosystem supports TS 7.
- **oxlint + oxfmt, not ESLint/Prettier.** Oxlint does not lint Vue `<template>` blocks yet; `nuxt typecheck` covers template type errors. Don't add ESLint to fill the gap. shadcn/lint was considered and skipped (can't see templates under Oxlint; DaisyUI components are classes, not Vue components).
- **Styling rule:** use DaisyUI components and semantic theme colors (`primary`, `base-100`, `base-content`, …), not raw Tailwind palette colors (`red-500`) or arbitrary values (`p-[13px]`).
- **Look** (from the owner's reference mockup `example_ui.webp`, kept untracked in the repo root): a grey page (`bg-base-200` on `<html>`, set in the layout's `useHead`), white `bg-base-100` cards with `shadow-xl`, black `btn-neutral` for primary actions, no divider lines. Home is the template: finish a page there, then copy the style to the others. **Mobile first** (the site is used mostly on phones); desktop gets revisited later, so mobile changes use `max-md:`/`max-lg:` and leave desktop alone.
  - Desktop: navbar with logo left, theme picker and Login right; a side menu whose active link is a white pill running to the left edge of the screen (`md:aria-[current=page]:` classes; `NuxtLink` sets `aria-current="page"`).
  - Mobile: navbar with the logo left and a menu button right, which opens a panel below it (theme picker, then Login, stacked). The page links are a sideways-scrolling row of tabs between the navbar and the content (active = black `bg-neutral` pill, others `text-base-content/30`). They're the same `<nav>` as the desktop side menu, and deliberately not in the navbar, so desktop isn't constrained by them.
- **Home on mobile:** the standings card ("Table") sits above the match-day card; both fit the owner's test phone without scrolling, and smaller screens scroll. Filling the screen height (cards stretching to the bottom) was tried and rejected. The table shows shirts only (no team names), 12px text, stats centered, headers the same size and color as the data at weight 500 (PTS values 600); it fits at 360px wide without sideways scrolling. Match rows have a fixed height (`h-10`, score `text-xl/6` + time `text-sm/4` = 40px) so entering a score doesn't grow the card; Edit is a round black pencil button at the end of the row for the same reason.
- **Themes keep DaisyUI's own colors.** `main.css` only changes shape on light and dark: pill radii and `--depth: 0` (flat, no component shadows). All other themes are untouched. The owner wants all 35 themes kept: the picker needs a better design, not fewer themes.
- **Icons are inline SVG paths** (chevrons, menu button, the Edit pencil from Lucide, ISC license); DaisyUI and Vue ship none. Switch to `@nuxt/icon` once more icons are needed, with a bundled icon set (e.g. `@iconify-json/lucide`) rather than runtime fetches from Iconify. The logo icon is the ⚽ emoji: the old app's `parisindoorsoccerlogo.svg` is a Vexels stock image ("All Rights Reserved"), so don't reuse it.
- **Dates display short** (`Oct 16`, `formatDate` in `app/utils/dates.ts`, shared by Home and Matches): every match day is a Friday, so the weekday adds nothing.
- **System font, no web font.** Poppins was dropped (the owner didn't like it, and its four weights were four downloads that swapped in after first paint). Pages use Tailwind's default `font-sans` (San Francisco on iPhone, Roboto on Android): nothing to download, no font swap. If a brand font is ever wanted, use one variable font (one file for every weight) via `@fontsource-variable/<name>`.
- **Page data stays cached between tab switches** (`getCachedData` in `useSeason`): a revisited page (or season) renders its last data at once and refreshes in the background. By default Nuxt 4 drops a page's data when leaving it, so every tab switch waited ~250ms on the server in dev. Consequence: pages must reset selections (Home's match day, Rosters' team) by watching `data.value?.season.id`, not `data`, or the background refresh (and `refreshNuxtData()` after a save) resets them.
- **Season routes make one database round trip.** `seasonId(slug)` in `server/utils/findSeason.ts` is the season id as a subquery, so a route's queries go in the same `Promise.all` as `findSeason` instead of waiting for it (dev API time went from ~170ms to ~95ms). Use it in any new season route.
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

- **`db:seed` only loads 2026/27** (`matches-2026-2027.json`, built from the league's schedule, same shape as the legacy files). D1 holds only that season for now. To migrate an older season, import its file in `server/tasks/db/seed.ts` again.
- `matches-2024-2025.json` / `matches-2025-2026.json` are copies of the old repo's `backend/config/matchData-*.json`. 2024/25 has final scores (the tests use it). **2025/26 has no scores in the JSON** — the real results live only in MongoDB.
- A `mongoexport --collection matches --jsonArray` has the same shape as those files. Drop it into `server/db/seed/` and re-run `db:seed`; the task upserts by match code.
- **Team colours** are CSS colour names. `TeamShirt` outlines every shirt in `base-content`, so `White` shows on light and dark themes. Adam's team is really White: the legacy files say `Grey` (a visibility workaround), so change that on import. The seed upserts teams by (season, colour), so changing a colour on a seeded team means `update teams set color = …` on D1 plus editing the JSON. Re-seeding with only the JSON changed adds a duplicate team.
- **Players exist only in MongoDB** (`rosterData.js` in the old repo is mock data). They need an export plus an import step, and photos must be re-uploaded from ImageKit to R2. Players have no season in Mongo — their team assignment per season must be decided on import.

## Deployment (live at https://paris-indoor-soccer-nuxt.nicholasjacarvalho.workers.dev; custom domain still to do)

1. ~~Create the GitHub repo and push.~~ Done: https://github.com/carvnich/paris-indoor-soccer-nuxt
2. ~~`wrangler login`, `wrangler d1 create`~~ Done: D1 `paris-indoor-soccer-nuxt` (ENAM), id `1d55e784-eeac-46ca-8988-197983ccc9fa`, migrations applied and 2026/27 seeded. R2 bucket `paris-indoor-soccer-nuxt-photos` (ENAM) created.
3. In the Cloudflare dashboard: Workers → Create → Import a repository. Build command `pnpm build:cloudflare`, deploy command `pnpm deploy:cloudflare`. No build variables: the D1 id is in `$production` in `nuxt.config.ts` (a missing build variable once left the binding out of `wrangler.json`).
4. Worker secrets: `NUXT_BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `NUXT_PUBLIC_SITE_URL=https://<domain>`. Type Secret, not Text: `wrangler deploy` removes dashboard Text variables that aren't in the config. The site URL must be exact (no quotes, spaces or trailing slash): a bad value made every auth request 500 with "Invalid siteUrl" in `wrangler tail`, which the browser showed as `NUXT_E1005` plus a hydration mismatch. It was set with `printf '%s' "https://…" | pnpm exec wrangler secret put NUXT_PUBLIC_SITE_URL --name paris-indoor-soccer-nuxt`; change it when the custom domain goes live.
5. Load production data: point dev at the real D1 (see Commands), run `pnpm dev` (applies the migrations), then run the `db:seed` and `db:create-user` tasks. Seed done (2026/27); staff accounts created (admins `nicholas.carvalho`, `kurtis.cruickshank`; referees `mike.bijman`, `claire.osmon`). An account created this way signs in on the Worker too (the password hash doesn't depend on `NUXT_BETTER_AUTH_SECRET`). The build output was also verified end to end on workerd against a local D1 (`wrangler d1 … --local --persist-to <dir>`, then `wrangler dev --config .output/server/wrangler.json --persist-to <dir>`).
6. Custom domain under Workers → Custom Domains, then retire both Vercel projects.

Push to `main` deploys (Workers Builds, about 1.5 minutes; logs under the Worker's Deployments tab, runtime errors with `pnpm exec wrangler tail paris-indoor-soccer-nuxt`). Schema changes need one extra step: start `pnpm dev` against D1 once before pushing (see "Only NuxtHub applies migrations"). Preview builds would give branches their own URLs, but they'd share the production D1 and R2; leave them off unless they're needed. Sign-in on a preview URL fails: Better Auth only trusts `NUXT_PUBLIC_SITE_URL` as an origin. Add `trustedOrigins` only if admin testing on previews turns out to be needed.

## Progress

1. [x] Scaffold: Nuxt 4, DaisyUI, NuxtHub (db + blob), Better Auth, oxlint/oxfmt, schema + first migration, seed + create-admin tasks. Verified: seed is re-runnable, sign-up blocked, admin guard 401/403/200, Cloudflare build + `wrangler deploy --dry-run` (488 KB gzip).
2. [x] Layout + navbar (`app/layouts/default.vue`); all DaisyUI themes + navbar picker with color previews (`theme` cookie rendered server-side; "System" = light/dark from OS)
3. [x] Public pages: Home (match day + standings), Matches (team filter), Rosters (empty until players are imported); all three have a season select and a styled 404 page. Pages default to the newest season. D1 only has 2026/27 (no scores yet); to see scored data, point dev back at local SQLite with 2024/25 seeded.
   - [x] Full-codebase review applied: matches index, parallel queries, `findSeason` + `useSeason` shared by the season routes/pages, one navbar menu for desktop and mobile, league timezone for "today", node tests (`pnpm test`), `objectWrap: "collapse"`. Still to eyeball in a browser: navbar at mobile width and the error page.
4. [x] Login page (`/login`, `auth: "guest"`, honours `?redirect=`) + `PATCH /api/matches/:id` (admin; score + start time, both scores empty = not played). Admins get an Edit button on every `MatchRow` (Home and Matches) that opens a dialog, then `refreshNuxtData()` so standings/playoffs recompute. Verified: 401/403/400/404/200 via curl, login + edit + sign-out in headless Chromium, and the same on workerd + local D1 (Deployment step 5).
   - [x] Better Auth over D1 verified (create admin, sign in, admin session, score write), after the drizzle casing patch.
   - [x] Staff accounts: username sign-in, `referee` role (scores only), `db:create-user`; four accounts on D1. Verified on local SQLite (sign-in, 401/403 by role) and on D1 + R2 in headless Chromium (referee sees score Edit but no roster controls; an admin's photo upload lands in R2 as 800px WebP and is deleted from R2 on remove).
5. [x] Players: add/edit/remove on the Rosters page, returning players, photo upload to blob (client-side resize). Verified against local SQLite + fs blob: 401/400/404 via curl, photo replace/remove deletes the old file, and add (1024px JPEG → 800px WebP) / edit / move team / remove in headless Chromium.
6. [ ] Import real data from MongoDB (25/26 results, players, photos), then drop `matches.code` (it only exists to match legacy rows on import)
7. [ ] Cloudflare deploy (steps above) + custom domain.
   - [x] D1 created, `pnpm dev` runs against it (`d1-http`), migrations applied, 2026/27 season seeded (6 teams, 75 regular + 5 playoff games, Oct 16 2026 → May 14 2027). The 7:30 "Drop-In" on finals night was left out (not a league game).
   - [x] R2 bucket created.
   - [x] Workers Builds import, Worker secrets, first deploy (2026-09-25). Two failed deploys first: no D1 binding (fixed by the id in `nuxt.config.ts`), then wrangler re-running migrations (fixed by dropping it from `deploy:cloudflare`). Verified live: all pages 200 with no console errors at 390px, session 200, signed-out PATCH 401, wrong password rejected. A real staff sign-in is still for the owner to try.
   - [ ] Custom domain, then retire the Vercel projects (step 6).
8. [ ] UI redesign (see "Look" under Decisions).
   - [x] Layout (grey page, padded navbar, side menu) and Home on desktop (large standings table; fixed-width match-day card with an overlapping black date square).
   - [x] Mobile navbar, menu panel and tab row; Home on mobile (see "Home on mobile" under Decisions). Committed in `0c4cce7`.
   - [x] Performance pass: cached page data across tabs, one round trip per season route, system font instead of Poppins (see Decisions). Revisiting a tab went from ~245ms to ~50ms in dev. Ideas found but not applied are listed under "Next session".
   - [ ] Tab row scrollbar: the layout uses `scrollbar-none`, which neither Tailwind 4 nor `main.css` defines, so desktop browsers show a scrollbar. Fix: `@utility scrollbar-none { scrollbar-width: none; }` in `main.css`.
   - [ ] Bring Matches, Rosters and Login to the Home style on mobile (they still have an earlier pill-tab/card restyle). `MatchRow` is shared, so Matches already has the fixed-height rows and pencil button.
   - [ ] Downloads page (visitors download files). The menu link exists; `/downloads` 404s until the page does, and the dev log warns "No match found for location with path /downloads".
   - [ ] Then, in order: desktop pass over the new mobile styles, team names on mobile (the table shows shirts only), page titles + favicon, a better theme picker (all themes), playoff bracket.

### Next session

- **Next up:** step 8, Matches on mobile in the Home style. The site is live on `workers.dev`; the custom domain (Deployment step 6) is the owner's call. Step 6 needs a `mongoexport` of the `matches` and players collections from the owner, plus the player photos from ImageKit.
- **Owner reviews UI changes themselves** on their running dev server (HMR picks up edits) and reports back; don't take screenshots to check styling unless asked. To check fit (overflow, row heights, font sizes), measure in Playwright instead: `scrollWidth` vs `clientWidth`, `offsetHeight`, `getComputedStyle`, at 360/375/390px wide.
- **The owner edits the same files by hand between requests.** Re-read a file before editing it, and treat their edits as the current state.
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
- **Local dev without editing `.env`:** blanking the token in the shell doesn't work (Nuxt loads `.env` over blank shell vars, so dev still hits D1 and R2). Instead run `pnpm dev --dotenv /tmp/local-dev.env`, a file with only `NUXT_BETTER_AUTH_SECRET` and `NUXT_PUBLIC_SITE_URL=http://localhost:3000` (recreate it if `/tmp` was cleared): that gives `.data/db` + `.data/blob`. Local data: 2024/25 seeded for scores (`?season=2024-2025`), admin `local.admin` / `localpass`, and test players with placeholder photos on 2026/27 Rosters.
- `--depth: 0` (see Themes) also removes DaisyUI's own shadows, e.g. the active tab in `tabs-box`; add `shadow-*` where one is wanted.
- DaisyUI tables: size classes (`table-xs`, …) only resize body rows; `thead` stays 0.875rem at 60% opacity. `table-xs` rows are 11px, which no Tailwind size matches, so Home sets `text-xs` on both header and rows. The browser makes `<th>` bold, which overrides a weight set on `thead`; set it on the cells (`*:font-medium` on the header `<tr>`).
- Making `<main>` a flex column shrinks page roots that use `mx-auto max-w-*` (the Login card went to 222px); they'd need `w-full`.
- Measuring right after an edit can catch the old CSS: the dev server rebuilds CSS for new classes a moment later. Re-run the measurement if numbers look off.
- Browser checks: `npm i playwright` in a scratch dir outside the repo works (`/tmp/pw` has it; run scripts from there, or relative screenshot paths land in the repo) (Chromium is already in `~/Library/Caches/ms-playwright`). Wait for `networkidle` before clicking, or the form submits before hydration. Set the `theme` cookie to screenshot a specific theme. After signing in, wait for the "Sign out" text, not `waitForURL("**/matches")` (that also matches `/login?redirect=/matches`).
- `nuxt typecheck` "Excessive stack depth" (TS2321) on a typed `$fetch`: happens when its promise is passed to a callback typed `() => Promise<unknown>` (use `() => unknown`) or the URL template contains a possibly-undefined value (use `!`).
- `ensureBlob` errors carry `message`, not `statusMessage`; the Rosters dialog reads `e.data.message`.
- "pnpm is running through Node.js because the script that installs its native binary was skipped" is harmless (it's about how pnpm itself was installed).
- `curl` gets JSON error bodies; add `-H "Accept: text/html"` to see the rendered error page.
- `pnpm db:generate` after schema edits; the dev server applies migrations on start (restart it).
- Git pushes as carvnich over the `github-personal` SSH alias; a plain `git push` works.
