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
	<div>
		<header class="navbar sticky top-0 z-10 bg-base-200 px-4 py-6 md:px-16 md:py-10">
			<button class="btn btn-square btn-ghost btn-sm md:hidden" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-6 stroke-current">
					<path v-if="menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					<path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h10" />
				</svg>
			</button>
			<NuxtLink to="/" class="flex-1 font-bold whitespace-nowrap md:text-3xl" @click="menuOpen = false">⚽ Paris Indoor Soccer</NuxtLink>

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
			<NuxtLink v-else to="/login" class="btn btn-neutral btn-md md:btn-lg">Login</NuxtLink>
		</header>

		<div class="md:flex">
			<!-- Side menu: the active link's background runs to the left edge, its text lines up with the logo. On mobile it opens below the navbar from the menu button. -->
			<nav class="flex flex-col gap-2 text-lg font-medium md:sticky md:top-32 md:pt-12 md:max-w-50 md:self-start" :class="{ 'max-md:hidden': !menuOpen }" @click="menuOpen = false">
				<NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-r-full py-3 pr-6 pl-4 text-base-content/30 aria-[current=page]:bg-base-100 aria-[current=page]:text-base-content md:pl-16">{{ link.label }}</NuxtLink>
			</nav>

			<main class="flex-1 px-4 pt-6 pb-16 md:px-16 md:pt-12 md:pb-24">
				<slot />
			</main>
		</div>
	</div>
</template>
