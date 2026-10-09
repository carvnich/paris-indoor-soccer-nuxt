<script setup lang="ts">
// DaisyUI built-in theme names (all enabled in main.css). No cookie = light/dark from the OS.
import themes from "daisyui/functions/themeOrder";

const { user, loggedIn, signOut } = useUserSession();

// The league in the URL, or the last one opened on pages without one (Login, 404). Not awaited, so the page's own fetch runs alongside.
const route = useRoute();
const { data: leagues } = useFetch("/api/leagues");
const leagueCookie = useLeagueCookie();
const league = computed(() => leagues.value?.find((l) => l.slug === route.params.league)?.slug ?? leagueCookie.value);
// Remembered for "/". Only here: separate useCookie refs don't see each other's changes. Only real leagues, so a mistyped URL can't send "/" to a 404.
watch(league, (slug) => (leagueCookie.value = slug), { immediate: true });
const leagueName = computed(() => leagues.value?.find((l) => l.slug === league.value)?.name);
// Icons are Lucide paths (house, calendar)
const links = computed(() => [
	{ to: `/${league.value}`, label: "Home", icon: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
	{ to: `/${league.value}/schedule`, label: "Schedule", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
]);

// The header's season picker and Follow dropdown (a calendar feed per team, server/routes/calendar; webcal:// opens the calendar app's subscribe prompt), on Home and Schedule
const seasonPage = computed(() => route.name === "league" || route.name === "league-schedule");
const { data: info } = useFetch("/api/teams", { query: { league, season: computed(() => route.query.season) } });
const season = computed(() => info.value?.seasons.find((s) => s.name.replace("/", "-") === route.query.season) ?? info.value?.seasons[0]);
const { host } = useRequestURL();
const feed = (color: string) => `webcal://${host}/calendar/${league.value}/${color.toLowerCase()}.ics?season=${String(route.query.season ?? info.value!.seasons[0]!.name.replace("/", "-"))}`;
// DaisyUI's dropdown stays open while it has focus
const closeDropdown = () => (document.activeElement as HTMLElement).blur();

// The menu button opens a right-side drawer with everything else: Downloads, leagues, theme, login
const drawer = ref(false);

// Stays on the same page (Home, Schedule, Downloads) in the other league, on its newest season; from Login it opens the league's Home
function pickLeague(slug: string) {
	drawer.value = false;
	navigateTo(route.params.league ? { params: { league: slug } } : `/${slug}`);
}

// A cookie (not localStorage) so the server renders the right theme and the page doesn't flash.
const theme = useCookie<string | null>("theme", { maxAge: 60 * 60 * 24 * 365 });
useHead({ htmlAttrs: { "data-theme": () => theme.value || undefined, class: "bg-base-200" } });

function pickTheme(name: string | null) {
	theme.value = name;
	drawer.value = false;
}

// Page-wide message, set with useState("toast") (MatchRow after a save). Here rather than in the row: a date change moves the match to another day, which unmounts its row.
const toast = useState("toast", () => "");
</script>

<template>
	<!-- DaisyUI drawer: the checkbox opens the menu (from the right, drawer-end); the page is the drawer content. DaisyUI gives the panel z-index 10, above the bar. -->
	<div class="drawer drawer-end">
		<input id="side-drawer" v-model="drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content">
			<!-- League header (scrolls away): the league's icon (public/leagues/<slug>.svg), name and subtitle, menu button on the right -->
			<header class="bg-primary text-primary-content">
				<div class="mx-auto px-4 pt-4 pb-6 md:w-11/12">
					<!-- Season picker and Follow, right-aligned, for the pages that have seasons: two DaisyUI dropdowns. Text is 12px on phones like the match rows; Follow's teams get a line between them. -->
					<div v-if="seasonPage && info" class="relative flex items-center justify-end gap-2 pb-4">
						<div class="dropdown dropdown-bottom dropdown-end">
							<button tabindex="0" class="btn btn-soft btn-primary btn-sm">
								{{ season?.name }}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg>
							</button>
							<ul tabindex="0" class="dropdown-content menu z-2 w-32 rounded-box bg-base-100 p-2 text-base-content shadow-lg max-md:text-xs md:text-lg">
								<li v-for="s in info.seasons" :key="s.id">
									<NuxtLink :to="{ query: { season: s.name.replace('/', '-') } }" @click="closeDropdown">{{ s.name }}</NuxtLink>
								</li>
							</ul>
						</div>
						<div class="dropdown dropdown-end">
							<button tabindex="0" class="btn btn-soft btn-primary btn-sm">Follow</button>
							<ul tabindex="0" class="dropdown-content menu z-2 w-40 rounded-box bg-base-100 p-2 text-base-content shadow-lg max-md:text-xs md:text-lg">
								<li class="menu-title">Follow a team</li>
								<li v-for="t in info.teams" :key="t.id" class="border-b border-base-300 last:border-0">
									<a :href="feed(t.color)" class="py-3" @click="closeDropdown">
										<TeamShirt :color="t.color" />
										{{ t.name }}
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<img :src="`/leagues/${league}.svg`" alt="" class="size-16 shrink-0" />
						<div class="flex-1">
							<div class="text-xl font-semibold md:text-3xl">{{ leagueName }}</div>
							<div class="text-sm opacity-60 md:text-lg">Paris Indoor Soccer</div>
						</div>
						<!-- Menu icon (Lucide) -->
						<button class="btn btn-square btn-ghost btn-lg rounded-lg text-primary-content" aria-label="Menu" @click="drawer = true">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-8 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
						</button>
					</div>
				</div>
			</header>
			<!-- The tabs stick to the top once the header has scrolled away. Full width, so card shadows scrolling under it don't show at its sides. z-1: cards and list rows are positioned and come later in the page, so without it they'd paint over the bar. -->
			<div class="sticky top-0 z-1 bg-primary text-primary-content">
				<!-- Icon + text tabs, the current one underlined -->
				<nav class="mx-auto flex gap-6 px-4 text-sm md:w-11/12 md:text-lg">
					<NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-2 py-3 opacity-60 aria-[current=page]:opacity-100">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" /></svg>
						{{ link.label }}
					</NuxtLink>
				</nav>

				<!-- Inside the bar, after the nav, so it paints over it -->
				<div v-if="toast" class="toast toast-center toast-top">
					<div class="alert rounded-lg alert-success">{{ toast }}</div>
				</div>
			</div>

			<main class="mx-auto px-4 pt-4 pb-8 md:w-11/12">
				<slot />
			</main>
		</div>

		<div class="drawer-side">
			<!-- Clicking the overlay closes the drawer -->
			<label for="side-drawer" aria-label="Close" class="drawer-overlay"></label>
			<!-- Icons are Lucide (download, palette, log-in mirrored, log-out) -->
			<ul class="menu min-h-full w-72 bg-base-100 p-4">
				<li>
					<NuxtLink :to="`/${league}/downloads`" @click="drawer = false">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" /></svg>
						Downloads
					</NuxtLink>
				</li>
				<li class="menu-title">League</li>
				<li v-for="l in leagues" :key="l.slug">
					<button :class="{ 'menu-active': l.slug === league }" @click="pickLeague(l.slug)">
						<img :src="`/leagues/${l.slug}.svg`" alt="" class="size-6 rounded-md" />
						{{ l.name }}
					</button>
				</li>
				<li class="menu-title">Settings</li>
				<li>
					<details>
						<summary>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8zM13.5 6.5h.01M17.5 10.5h.01M8.5 7.5h.01M6.5 12.5h.01" />
							</svg>
							Theme
						</summary>
						<!-- The dots set data-theme on themselves, so they preview that theme's colors -->
						<ul>
							<li>
								<button :class="{ 'menu-active': !theme }" @click="pickTheme(null)">System</button>
							</li>
							<li v-for="name in themes" :key="name">
								<button :class="{ 'menu-active': theme === name }" @click="pickTheme(name)">
									<span class="flex-1 text-left">{{ name }}</span>
									<span :data-theme="name" class="flex gap-1 bg-transparent">
										<span class="size-2 rounded-full bg-primary"></span>
										<span class="size-2 rounded-full bg-secondary"></span>
										<span class="size-2 rounded-full bg-accent"></span>
										<span class="size-2 rounded-full bg-neutral"></span>
									</span>
								</button>
							</li>
						</ul>
					</details>
				</li>
				<li v-if="loggedIn">
					<button :title="user?.name" @click="(signOut(), (drawer = false))">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
						Sign out
					</button>
				</li>
				<li v-else>
					<NuxtLink to="/login" @click="drawer = false">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 17l-5-5 5-5M9 12h12M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /></svg>
						Login
					</NuxtLink>
				</li>
			</ul>
		</div>
	</div>
</template>
