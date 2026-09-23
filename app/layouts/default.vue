<script setup lang="ts">
// DaisyUI built-in theme names (all enabled in main.css). No cookie = light/dark from the OS.
import themes from "daisyui/functions/themeOrder";

const { user, loggedIn, signOut } = useUserSession();
const menuOpen = ref(false);

const links = [
	{ to: "/", label: "Home" },
	{ to: "/matches", label: "Matches" },
	{ to: "/rosters", label: "Rosters" },
];

// A cookie (not localStorage) so the server renders the right theme and the page doesn't flash.
const theme = useCookie<string | null>("theme", { maxAge: 60 * 60 * 24 * 365 });
useHead({ htmlAttrs: { "data-theme": () => theme.value || undefined } });

function pickTheme(name: string | null) {
	theme.value = name;
	// The DaisyUI dropdown stays open while it has focus
	(document.activeElement as HTMLElement | null)?.blur();
}
</script>

<template>
	<div class="min-h-screen bg-base-100">
		<header class="navbar sticky top-0 z-30 bg-base-200 shadow-sm">
			<div class="flex-1">
				<NuxtLink to="/" class="btn btn-ghost text-lg md:text-xl" @click="menuOpen = false">⚽ Paris Indoor Soccer</NuxtLink>
			</div>

			<!-- Inline on desktop; below the navbar on mobile when the menu button is open -->
			<ul class="menu md:menu-horizontal max-md:absolute max-md:inset-x-0 max-md:top-full max-md:rounded-b-box max-md:bg-base-200 max-md:p-4 max-md:shadow-sm" :class="{ 'max-md:hidden': !menuOpen }" @click="menuOpen = false">
				<li v-for="link in links" :key="link.to">
					<NuxtLink :to="link.to" exact-active-class="menu-active">{{ link.label }}</NuxtLink>
				</li>
				<li v-if="loggedIn">
					<button @click="signOut()">Sign out ({{ user?.name }})</button>
				</li>
				<li v-else>
					<NuxtLink to="/login">Login</NuxtLink>
				</li>
			</ul>

			<!-- Each item sets data-theme on itself, so its colors preview that theme -->
			<div class="dropdown dropdown-end ml-2">
				<div tabindex="0" role="button" class="btn btn-ghost btn-sm">{{ theme ?? "System" }} ▾</div>
				<ul tabindex="-1" class="dropdown-content menu z-40 mt-2 max-h-96 flex-nowrap gap-1 overflow-y-auto rounded-box bg-base-200 p-2 shadow-lg">
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

			<button class="btn btn-square btn-ghost md:hidden" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-6 stroke-current">
					<path v-if="menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					<path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</header>

		<main class="mx-auto max-w-5xl p-4">
			<slot />
		</main>
	</div>
</template>
