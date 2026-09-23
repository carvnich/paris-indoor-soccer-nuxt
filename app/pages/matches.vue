<script setup lang="ts">
const route = useRoute();
const data = await useSeason("/api/season");

const teamId = ref<number>();
watch(
	() => route.query.season,
	() => (teamId.value = undefined),
);
const days = computed(() => groupByDay((data.value?.matches ?? []).filter((m) => !teamId.value || m.homeTeamId === teamId.value || m.awayTeamId === teamId.value)));
const nextDay = computed(() => days.value[nextDayIndex(days.value)]?.[0]);
</script>

<template>
	<div v-if="data" class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-2">
			<h1 class="text-2xl font-bold">Matches</h1>
			<div class="flex gap-2">
				<NuxtLink :to="{ query: route.query, hash: `#day-${nextDay}` }" class="btn btn-sm">Today</NuxtLink>
				<SeasonSelect :seasons="data.seasons" :season-id="data.season.id" />
			</div>
		</div>

		<div role="tablist" class="tabs tabs-box">
			<button role="tab" class="tab" :class="{ 'tab-active': !teamId }" @click="teamId = undefined">All</button>
			<button v-for="t in data.teams" :key="t.id" role="tab" class="tab" :class="{ 'tab-active': teamId === t.id }" :title="t.name" @click="teamId = t.id">
				<TeamShirt :color="t.color" />
			</button>
		</div>

		<section v-for="[day, dayMatches] in days" :id="`day-${day}`" :key="day" class="card scroll-mt-20 bg-base-200">
			<div class="card-body">
				<h2 class="card-title">
					{{ formatDate(day) }}
					<span v-if="dayMatches.some((m) => m.isPlayoff)" class="badge badge-warning">Playoffs</span>
				</h2>
				<MatchRow v-for="m in dayMatches" :key="m.id" :match="m" :teams="data.teams" />
			</div>
		</section>
	</div>
</template>
