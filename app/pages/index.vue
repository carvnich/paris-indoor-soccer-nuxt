<script setup lang="ts">
// "/" opens the last league the visitor picked. First visit: pick one here (the layout keeps the cookie up to date after that).
// No layout: its tabs need a league, and the layout's cookie ref never exists alongside this one. A plain useCookie, since useLeagueCookie's default would count as a pick.
definePageMeta({ layout: false });
const picked = useCookie<string | undefined>("league", { maxAge: 60 * 60 * 24 * 365 });
if (picked.value) await navigateTo(`/${picked.value}`, { replace: true });
const { data: leagues } = await useFetch("/api/leagues");
useHead({ htmlAttrs: { class: "bg-base-300" } });
</script>

<template>
	<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
		<h1 class="text-center text-2xl font-medium">Choose your league</h1>
		<NuxtLink v-for="l in leagues" :key="l.slug" :to="`/${l.slug}`" class="btn btn-lg btn-neutral" @click="picked = l.slug">{{ l.name }}</NuxtLink>
	</main>
</template>
