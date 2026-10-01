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
const links = computed(() => [
	{ to: `/${league.value}`, label: "Home" },
	{ to: `/${league.value}/schedule`, label: "Schedule" },
	{ to: `/${league.value}/downloads`, label: "Downloads" },
]);

// The league and theme buttons open one left-side drawer, showing the list of whichever was clicked
const drawer = ref(false);
const panel = ref<"league" | "theme">("league");
function openDrawer(p: "league" | "theme") {
	panel.value = p;
	drawer.value = true;
}

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
	<!-- DaisyUI drawer: the checkbox opens the side panel (from the left); the page is the drawer content. DaisyUI gives the panel z-index 10, above the bar. -->
	<div class="drawer">
		<input id="side-drawer" v-model="drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content">
			<!-- A full-width sticky bar, so card shadows scrolling under it don't show at its sides. z-1: cards and list rows are positioned and come later in the page, so without it they'd paint over the bar. -->
			<div class="sticky top-0 z-1 bg-base-200">
				<!-- One row at every width (11/12 of the screen wide on desktop): page tabs, then league, theme and login on the right (ml-auto). Scrolls sideways once it's wider than the screen. -->
				<nav class="navbar mx-auto gap-2 overflow-x-auto scrollbar-none px-4 text-sm whitespace-nowrap md:w-11/12 md:text-lg">
					<NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-full px-4 py-2 text-base-content/30 aria-[current=page]:bg-neutral aria-[current=page]:text-neutral-content">{{ link.label }}</NuxtLink>

					<!-- Phones: a calendar icon (Lucide) instead of the league name, which stays for screen readers (sr-only) -->
					<button class="btn btn-soft btn-primary ml-auto btn-md max-md:btn-square max-md:rounded-lg md:btn-lg" @click="openDrawer('league')">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current md:hidden"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
						<span class="max-md:sr-only">{{ leagues?.find((l) => l.slug === league)?.name }}</span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current max-md:hidden"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg>
					</button>

					<button class="btn btn-sm" :title="`Theme: ${theme ?? 'System'}`" @click="openDrawer('theme')">
						<span class="flex gap-2">
							<span class="size-2 rounded-full bg-primary"></span>
							<span class="size-2 rounded-full bg-secondary"></span>
							<span class="size-2 rounded-full bg-accent"></span>
						</span>
					</button>

					<!-- Phones: log-out and log-in icons (Lucide; log-in mirrored so both doors are on the left: the log-in arrow points left into it, the log-out arrow right out of it) -->
					<button v-if="loggedIn" class="btn btn-soft btn-md btn-error max-md:btn-square max-md:rounded-lg md:btn-lg" :title="user?.name" @click="signOut()">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current md:hidden"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
						<span class="max-md:sr-only">Sign out</span>
					</button>
					<NuxtLink v-else to="/login" class="btn btn-soft btn-md btn-success max-md:btn-square max-md:rounded-lg md:btn-lg">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current md:hidden"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 17l-5-5 5-5M9 12h12M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /></svg>
						<span class="max-md:sr-only">Login</span>
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
			<ul v-if="panel === 'league'" class="menu min-h-full w-72 bg-base-100 p-4">
				<li class="menu-title">League</li>
				<li v-for="l in leagues" :key="l.slug">
					<button :class="{ 'menu-active': l.slug === league }" @click="pickLeague(l.slug)">{{ l.name }}</button>
				</li>
			</ul>
			<!-- Each item sets data-theme on itself, so its colors preview that theme -->
			<ul v-else class="menu min-h-full w-72 gap-1 bg-base-100 p-4">
				<li class="menu-title">Theme</li>
				<li>
					<button :class="{ 'menu-active': !theme }" @click="pickTheme(null)">System</button>
				</li>
				<li v-for="name in themes" :key="name">
					<button :data-theme="name" class="bg-base-100 text-base-content" :class="{ 'outline-2 outline-base-content': theme === name }" @click="pickTheme(name)">
						<span class="flex-1 text-left">{{ name }}</span>
						<span class="flex gap-1">
							<span class="size-2 rounded-full bg-primary"></span>
							<span class="size-2 rounded-full bg-secondary"></span>
							<span class="size-2 rounded-full bg-accent"></span>
							<span class="size-2 rounded-full bg-neutral"></span>
						</span>
					</button>
				</li>
			</ul>
		</div>
	</div>
</template>
