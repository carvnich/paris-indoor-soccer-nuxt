<script setup lang="ts">
import { rules } from "~/data/rules";

// An unknown league is a 404 (the same /api/leagues call the layout makes, so it's shared); a known league without rules says so
const route = useRoute();
const { data: leagues } = await useFetch("/api/leagues");
if (!leagues.value?.some((l) => l.slug === route.params.league)) throw createError({ statusCode: 404, statusMessage: "League not found", fatal: true });
const sections = computed(() => rules[String(route.params.league)] ?? []);
</script>

<template>
	<!-- A white card like Downloads'; each section has a heading, then paragraphs and numbered lists -->
	<section class="flex flex-col gap-6 rounded-box bg-base-100 p-6 text-sm wrap-break-word md:p-10 shadow-xl md:text-lg">
		<h1 class="text-xl font-medium md:text-3xl">Rules</h1>
		<p v-if="!sections.length" class="opacity-50">No rules yet</p>
		<section v-for="s in sections" :key="s.heading" class="flex flex-col gap-2">
			<h2 class="text-base font-semibold md:text-2xl">{{ s.heading }}</h2>
			<template v-for="(b, i) in s.blocks" :key="i">
				<ol v-if="Array.isArray(b)" class="ml-6 flex list-decimal flex-col gap-2">
					<li v-for="item in b" :key="item">{{ item }}</li>
				</ol>
				<p v-else>{{ b }}</p>
			</template>
		</section>
	</section>
</template>
