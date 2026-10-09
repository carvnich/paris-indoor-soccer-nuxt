<script setup lang="ts">
const data = await useSeason("/api/season");

// Start on the next match day to play, again after a season change
const days = computed(() => groupByDay(data.value?.matches ?? []));
const dayIndex = ref(nextDayIndex(days.value));
watch(
	() => data.value?.season.id,
	() => (dayIndex.value = nextDayIndex(days.value)),
);
const day = computed(() => days.value[dayIndex.value]);
</script>

<template>
	<div v-if="data" class="flex flex-col gap-6">
		<!-- The selected match day out of the season's match days, playoffs included -->
		<progress v-if="day" class="progress h-1" :value="dayIndex + 1" :max="days.length" aria-label="Season progress"></progress>

		<!-- The selected match day, with previous/next arrows beside the date (rounded-lg: light and dark round fields by 2rem, which would make a small square a circle) -->
		<MatchDayCard v-if="day" :date="day[0]" :matches="day[1]" :teams="data.teams">
			<div class="flex gap-1">
				<button class="btn rounded-lg btn-square btn-ghost btn-sm" aria-label="Previous match day" :disabled="dayIndex === 0" @click="dayIndex--">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6l-6 6 6 6" /></svg>
				</button>
				<button class="btn rounded-lg btn-square btn-ghost btn-sm" aria-label="Next match day" :disabled="dayIndex === days.length - 1" @click="dayIndex++">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6l6 6-6 6" /></svg>
				</button>
			</div>
		</MatchDayCard>

		<!-- A white card, like the match-day card above it -->
		<section class="flex flex-col gap-4 rounded-box bg-base-100 p-4 shadow-xl">
			<div class="overflow-x-auto">
				<table class="table table-xs text-center md:table-md">
					<thead class="text-xs text-base-content md:text-lg">
						<!-- Phones: narrower cells (max-md:*:px-1) so the team names fit; long names wrap -->
						<tr class="*:font-medium max-md:*:px-1">
							<th class="text-left">#</th>
							<th class="text-left">Team</th>
							<th>PL</th>
							<th>W</th>
							<th>D</th>
							<th>L</th>
							<th>+/-</th>
							<th>GD</th>
							<th>PTS</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(t, i) in data.standings" :key="t.id" class="text-xs max-md:*:px-1 *:py-2 md:text-lg">
							<td class="text-left">{{ i + 1 }}</td>
							<td>
								<div class="flex items-center gap-1 text-left md:gap-2">
									<TeamShirt :color="t.color" />
									<span>{{ t.name }}</span>
								</div>
							</td>
							<td>{{ t.played }}</td>
							<td>{{ t.wins }}</td>
							<td>{{ t.draws }}</td>
							<td>{{ t.losses }}</td>
							<td>{{ t.goalsFor }}-{{ t.goalsAgainst }}</td>
							<td>{{ t.goalDifference > 0 ? "+" : "" }}{{ t.goalDifference }}</td>
							<td class="font-semibold">{{ t.points }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>
