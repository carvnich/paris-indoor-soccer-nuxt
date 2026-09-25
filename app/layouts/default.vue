<script setup lang="ts">
// DaisyUI built-in theme names (all enabled in main.css). No cookie = light/dark from the OS.
import themes from "daisyui/functions/themeOrder";

const { user, loggedIn, signOut } = useUserSession();
const menuOpen = ref(false);

const links = [
	{ to: "/", label: "Home" },
	{ to: "/matches", label: "Matches" },
	{ to: "/rosters", label: "Rosters" },
	{ to: "/downloads", label: "Downloads" },
];

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
	<div class="px-4">
		<header class="navbar sticky top-0 z-10 bg-base-200">
			<NuxtLink to="/" class="flex-1 text-lg font-medium whitespace-nowrap" aria-label="Paris Indoor Soccer">⚽ Paris Indoor Soccer</NuxtLink>

			<!-- Theme picker and login: in the navbar on desktop, in a panel below the menu button on mobile -->
			<div class="flex items-center gap-2 max-md:absolute max-md:top-full max-md:right-4 max-md:flex-col max-md:rounded-box max-md:bg-base-100 max-md:p-4 max-md:shadow-xl" :class="{ 'max-md:hidden': !menuOpen }">
				<!-- Each item sets data-theme on itself, so its colors preview that theme -->
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-sm" :title="`Theme: ${theme ?? 'System'}`">
						<span class="flex gap-2">
							<span class="size-2 rounded-full bg-primary"></span>
							<span class="size-2 rounded-full bg-secondary"></span>
							<span class="size-2 rounded-full bg-accent"></span>
						</span>
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

		<div class="md:flex mt-4">
			<!-- Desktop: side menu, the active link's background runs to the left edge and its text lines up with the logo. Mobile: a sideways-scrolling row of pill tabs. -->
			<nav class="flex overflow-x-auto scrollbar-none text-sm md:sticky md:top-32 md:max-w-50 md:flex-col md:self-start md:px-0 md:pt-12">
				<NuxtLink
					v-for="link in links"
					:key="link.to"
					:to="link.to"
					class="rounded-full px-4 py-2 text-base-content/30 max-md:aria-[current=page]:bg-neutral max-md:aria-[current=page]:text-neutral-content md:rounded-l-none md:py-3 md:pr-6 md:pl-16 md:aria-[current=page]:bg-base-100 md:aria-[current=page]:text-base-content"
					>{{ link.label }}</NuxtLink
				>
			</nav>

			<main class="flex-1 pt-6 md:pt-12">
				<slot />
			</main>
		</div>
	</div>
</template>
