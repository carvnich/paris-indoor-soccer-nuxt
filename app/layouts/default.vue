<script setup lang="ts">
const { user, loggedIn, signOut } = useUserSession();
const menuOpen = ref(false);

const links = [
	{ to: "/", label: "Home" },
	{ to: "/matches", label: "Matches" },
	{ to: "/rosters", label: "Rosters" },
];
</script>

<template>
	<div class="min-h-screen bg-base-100">
		<header class="navbar sticky top-0 z-30 bg-base-200 shadow-sm">
			<div class="flex-1">
				<NuxtLink to="/" class="btn btn-ghost text-lg md:text-xl" @click="menuOpen = false">⚽ Paris Indoor Soccer</NuxtLink>
			</div>

			<!-- Desktop -->
			<nav class="hidden items-center gap-2 md:flex">
				<ul class="menu menu-horizontal">
					<li v-for="link in links" :key="link.to">
						<NuxtLink :to="link.to" exact-active-class="menu-active">{{ link.label }}</NuxtLink>
					</li>
				</ul>
				<template v-if="loggedIn">
					<span class="font-semibold">{{ user?.name }}</span>
					<button class="btn btn-ghost btn-sm" @click="signOut()">Sign out</button>
				</template>
				<NuxtLink v-else to="/login" class="btn btn-primary btn-sm">Login</NuxtLink>
			</nav>

			<!-- Mobile -->
			<button class="btn btn-square btn-ghost md:hidden" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-6 stroke-current">
					<path v-if="menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					<path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<ul v-if="menuOpen" class="menu absolute top-full right-0 left-0 rounded-b-box bg-base-200 p-4 shadow-sm md:hidden" @click="menuOpen = false">
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
		</header>

		<slot />
	</div>
</template>
