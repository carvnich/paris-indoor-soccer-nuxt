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
	<div v-if="data" class="flex flex-col gap-16">
		<!-- A white card, like the match-day card below it -->
		<section class="flex flex-col gap-4 rounded-box bg-base-100 p-4 shadow-xl">
			<div class="flex items-center justify-between gap-2">
				<h1 class="text-xl font-medium md:text-3xl">Table</h1>
				<SeasonSelect class="md:select-md" :seasons="data.seasons" :season-id="data.season.id" />
			</div>
			<div class="overflow-x-auto">
				<table class="table table-xs text-center md:table-md">
					<thead class="text-xs text-base-content md:text-lg">
						<tr class="*:font-medium">
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
						<tr v-for="(t, i) in data.standings" :key="t.id" class="text-xs md:text-lg">
							<td class="text-left">{{ i + 1 }}</td>
							<td>
								<div class="flex items-center gap-2">
									<TeamShirt :color="t.color" />
									<span class="font-medium max-md:hidden">{{ t.name }}</span>
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

		<!-- White card of matches below the standings, with the square black date card overlapping its top edge -->
		<section v-if="day" class="card bg-base-100 shadow-xl">
			<div class="card-body gap-8 p-4 text-sm md:text-lg">
				<div class="-mt-12 flex items-center justify-center gap-4">
					<button class="btn btn-circle btn-ghost" aria-label="Previous match day" :disabled="dayIndex === 0" @click="dayIndex--">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-10 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6l-6 6 6 6" /></svg>
					</button>
					<div class="flex size-28 items-center justify-center rounded-box bg-neutral text-neutral-content shadow-xl">
						<h2 class="text-2xl md:text-3xl">{{ formatDate(day[0]) }}</h2>
					</div>
					<button class="btn btn-circle btn-ghost" aria-label="Next match day" :disabled="dayIndex === days.length - 1" @click="dayIndex++">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-10 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6l6 6-6 6" /></svg>
					</button>
				</div>
				<!-- Matches spread over the rest of the card's height -->
				<div class="flex flex-1 flex-col justify-evenly gap-8">
					<MatchRow v-for="m in day[1]" :key="m.id" :match="m" :teams="data.teams" />
				</div>
			</div>
		</section>
	</div>
</template>
