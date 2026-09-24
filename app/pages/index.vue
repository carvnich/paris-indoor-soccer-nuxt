<script setup lang="ts">
const data = await useSeason("/api/season");

// Start on the next match day to play
const days = computed(() => groupByDay(data.value?.matches ?? []));
const dayIndex = ref(nextDayIndex(days.value));
watch(days, () => (dayIndex.value = nextDayIndex(days.value)));
const day = computed(() => days.value[dayIndex.value]);
</script>

<template>
	<div v-if="data" class="flex flex-col items-start gap-16 lg:flex-row">
		<!-- Portrait white card of matches (fixed width so it doesn't resize between days), with the square black date card overlapping its top edge -->
		<section v-if="day" class="card mt-6 bg-base-100 lg:order-last lg:aspect-2/3 lg:w-md">
			<div class="card-body gap-8 text-lg">
				<div class="-mt-12 flex size-48 items-center justify-center self-center rounded-box bg-neutral text-neutral-content shadow-xl">
					<button class="btn btn-circle btn-neutral btn-sm" aria-label="Previous match day" :disabled="dayIndex === 0" @click="dayIndex--">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-8 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6l-6 6 6 6" /></svg>
					</button>
					<h2 class="text-3xl font-bold">{{ formatDate(day[0]) }}</h2>
					<button class="btn btn-circle btn-neutral btn-sm" aria-label="Next match day" :disabled="dayIndex === days.length - 1" @click="dayIndex++">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-8 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6l6 6-6 6" /></svg>
					</button>
				</div>
				<!-- Matches spread over the rest of the card's height -->
				<div class="flex flex-1 flex-col justify-evenly gap-8">
					<MatchRow v-for="m in day[1]" :key="m.id" :match="m" :teams="data.teams" />
				</div>
			</div>
		</section>

		<section class="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:flex-1">
			<div class="flex items-center justify-between gap-2">
				<h1 class="text-5xl font-bold">Standings</h1>
				<SeasonSelect :seasons="data.seasons" :season-id="data.season.id" />
			</div>
			<div class="overflow-x-auto">
				<table class="table table-lg">
					<thead>
						<tr>
							<th>#</th>
							<th>Team</th>
							<th>PL</th>
							<th>W</th>
							<th>D</th>
							<th>L</th>
							<th class="hidden md:table-cell">GF-GA</th>
							<th>GD</th>
							<th>PTS</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(t, i) in data.standings" :key="t.id">
							<td>{{ i + 1 }}</td>
							<td>
								<div class="flex items-center gap-2">
									<TeamShirt :color="t.color" />
									<span class="hidden font-medium md:inline">{{ t.name }}</span>
								</div>
							</td>
							<td>{{ t.played }}</td>
							<td>{{ t.wins }}</td>
							<td>{{ t.draws }}</td>
							<td>{{ t.losses }}</td>
							<td class="hidden md:table-cell">{{ t.goalsFor }}-{{ t.goalsAgainst }}</td>
							<td>{{ t.goalDifference > 0 ? "+" : "" }}{{ t.goalDifference }}</td>
							<td class="font-bold">{{ t.points }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>
