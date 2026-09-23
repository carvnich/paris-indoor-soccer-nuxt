<script setup lang="ts">
import type * as schema from "~~/server/db/schema";

const props = defineProps<{ match: typeof schema.matches.$inferSelect; teams: (typeof schema.teams.$inferSelect)[] }>();
const home = computed(() => props.teams.find((t) => t.id === props.match.homeTeamId));
const away = computed(() => props.teams.find((t) => t.id === props.match.awayTeamId));
const played = computed(() => props.match.homeScore !== null && props.match.awayScore !== null);
</script>

<template>
	<div class="flex items-center gap-2 py-1">
		<div class="flex flex-1 items-center justify-end gap-2 text-right">
			{{ home?.name ?? match.homeSlot }}
			<TeamShirt v-if="home" :color="home.color" />
		</div>
		<div class="w-24 text-center">
			<div v-if="played" class="text-lg font-bold">{{ match.homeScore }} - {{ match.awayScore }}</div>
			<div :class="played ? 'text-xs opacity-60' : 'font-semibold'">{{ formatTime(match.startsAt) }}</div>
		</div>
		<div class="flex flex-1 items-center gap-2">
			<TeamShirt v-if="away" :color="away.color" />
			{{ away?.name ?? match.awaySlot }}
		</div>
	</div>
</template>
