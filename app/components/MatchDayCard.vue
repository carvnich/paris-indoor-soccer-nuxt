<script setup lang="ts">
import type * as schema from "~~/server/db/schema";

// One match day in a white card: the date (and whatever the page puts in the slot, e.g. Home's day arrows) above a faint line, then the day's matches
defineProps<{ date: string; matches: (typeof schema.matches.$inferSelect)[]; teams: (typeof schema.teams.$inferSelect)[] }>();
</script>

<template>
	<section class="rounded-box bg-base-100 shadow-xl">
		<div class="flex items-center justify-between gap-2 border-b border-base-300 px-4 py-2">
			<h2 class="text-sm font-semibold md:text-lg">{{ formatDate(date) }}</h2>
			<slot />
		</div>
		<ul class="list *:after:hidden md:text-lg">
			<MatchRow v-for="m in matches" :key="m.id" :match="m" :teams="teams" />
		</ul>
	</section>
</template>
