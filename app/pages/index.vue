<script setup lang="ts">
const route = useRoute();
const data = await useSeason("/api/season");

// Start on the next match day to play
const days = computed(() => groupByDay(data.value?.matches ?? []));
const dayIndex = ref(nextDayIndex(days.value));
watch(days, () => (dayIndex.value = nextDayIndex(days.value)));
const day = computed(() => days.value[dayIndex.value]);
</script>

<template>
	<div v-if="data" class="flex flex-col gap-6">
		<section v-if="day" class="card bg-base-200">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<button class="btn btn-square btn-sm" aria-label="Previous match day" :disabled="dayIndex === 0" @click="dayIndex--">‹</button>
					<h2 class="card-title">
						{{ formatDate(day[0]) }}
						<span v-if="day[1].some((m) => m.isPlayoff)" class="badge badge-warning">Playoffs</span>
					</h2>
					<button class="btn btn-square btn-sm" aria-label="Next match day" :disabled="dayIndex === days.length - 1" @click="dayIndex++">›</button>
				</div>
				<MatchRow v-for="m in day[1]" :key="m.id" :match="m" :teams="data.teams" />
				<NuxtLink :to="{ path: '/matches', query: route.query, hash: `#day-${day[0]}` }" class="btn btn-sm self-center">All matches</NuxtLink>
			</div>
		</section>

		<section class="card bg-base-200">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title">Standings</h2>
					<SeasonSelect :seasons="data.seasons" :season-id="data.season.id" />
				</div>
				<div class="overflow-x-auto">
					<table class="table">
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
										<span class="hidden md:inline">{{ t.name }}</span>
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
			</div>
		</section>
	</div>
</template>
