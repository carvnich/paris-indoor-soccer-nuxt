<script setup lang="ts">
// DaisyUI built-in theme names (all enabled in main.css). No cookie = light/dark from the OS.
import themes from "daisyui/functions/themeOrder";

const { user, loggedIn, signOut } = useUserSession();
const menuOpen = ref(false);

// The league in the URL, or the last one opened on pages without one (Login, 404). Not awaited, so the page's own fetch runs alongside.
const route = useRoute();
const { data: leagues } = useFetch("/api/leagues");
const leagueCookie = useLeagueCookie();
const league = computed(() => leagues.value?.find((l) => l.slug === route.params.league)?.slug ?? leagueCookie.value);
// Remembered for "/". Only here: separate useCookie refs don't see each other's changes. Only real leagues, so a mistyped URL can't send "/" to a 404.
watch(league, (slug) => (leagueCookie.value = slug), { immediate: true });
const links = computed(() => [
	{ to: `/${league.value}`, label: "Home" },
	{ to: `/${league.value}/matches`, label: "Matches" },
	{ to: `/${league.value}/downloads`, label: "Downloads" },
]);

// Stays on the same page (Home, Matches) in the other league, on its newest season; from Login it opens the league's Home
function pickLeague(slug: string) {
	menuOpen.value = false;
	// The DaisyUI dropdown stays open while it has focus
	(document.activeElement as HTMLElement | null)?.blur();
	navigateTo(route.params.league ? { params: { league: slug } } : `/${slug}`);
}

// A cookie (not localStorage) so the server renders the right theme and the page doesn't flash.
const theme = useCookie<string | null>("theme", { maxAge: 60 * 60 * 24 * 365 });
useHead({ htmlAttrs: { "data-theme": () => theme.value || undefined, class: "bg-base-200" } });

function pickTheme(name: string | null) {
	theme.value = name;
	// The DaisyUI dropdown stays open while it has focus
	(document.activeElement as HTMLElement | null)?.blur();
}
</script>

<template>
	<!-- The mobile layout at every width, 11/12 of the screen wide on desktop -->
	<div class="mx-auto px-4 md:w-11/12">
		<header class="navbar sticky top-0 z-10 bg-base-200">
			<NuxtLink to="/" class="flex-1 text-lg font-medium whitespace-nowrap md:text-2xl" aria-label="Paris Indoor Soccer">⚽ Paris Indoor Soccer</NuxtLink>

			<!-- League picker, theme picker and login: in the navbar on desktop, in a panel below the menu button on mobile -->
			<div class="flex items-center gap-2 max-md:absolute max-md:top-full max-md:right-4 max-md:flex-col max-md:rounded-box max-md:bg-base-100 max-md:p-4 max-md:shadow-xl" :class="{ 'max-md:hidden': !menuOpen }">
				<div class="dropdown">
					<div tabindex="0" role="button" class="btn btn-soft btn-md md:btn-lg">
						{{ leagues?.find((l) => l.slug === league)?.name }}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg>
					</div>
					<ul tabindex="-1" class="dropdown-content menu rounded-box bg-base-100 shadow-xl">
						<li v-for="l in leagues" :key="l.slug">
							<button :class="{ 'menu-active': l.slug === league }" @click="pickLeague(l.slug)">{{ l.name }}</button>
						</li>
					</ul>
				</div>

				<!-- Each item sets data-theme on itself, so its colors preview that theme -->
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-sm" :title="`Theme: ${theme ?? 'System'}`">
						<span class="flex gap-2">
							<span class="size-2 rounded-full bg-primary"></span>
							<span class="size-2 rounded-full bg-secondary"></span>
							<span class="size-2 rounded-full bg-accent"></span>
						</span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg>
					</div>
					<ul tabindex="-1" class="dropdown-content menu z-40 mt-2 max-h-96 flex-nowrap gap-1 overflow-y-auto rounded-box bg-base-100 p-2 shadow-xl">
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

				<button v-if="loggedIn" class="btn btn-ghost btn-md md:btn-lg" :title="user?.name" @click="signOut()">Sign out</button>
				<NuxtLink v-else to="/login" class="btn btn-neutral btn-md md:btn-lg" @click="menuOpen = false">Login</NuxtLink>
			</div>

			<button class="btn btn-square btn-ghost md:hidden" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-6 stroke-current">
					<path v-if="menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					<path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M10 16h10" />
				</svg>
			</button>
		</header>

		<!-- A centered row of pill tabs that scrolls sideways once it's wider than the screen ("safe" centering keeps the first tab reachable) -->
		<nav class="mt-4 flex justify-center-safe overflow-x-auto scrollbar-none text-sm md:text-lg">
			<NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-full px-4 py-2 text-base-content/30 aria-[current=page]:bg-neutral aria-[current=page]:text-neutral-content">{{ link.label }}</NuxtLink>
		</nav>

		<main class="pt-6 pb-8">
			<slot />
		</main>
	</div>
</template>
