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
// Season progress: match days before today out of all match days, playoffs included, whatever the team filter
const allDays = computed(() => groupByDay(data.value?.matches ?? []));
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>

<template>
	<div v-if="data" class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-2">
			<h1 class="text-4xl font-bold">Matches</h1>
			<div class="flex gap-2">
				<NuxtLink :to="{ query: route.query, hash: `#day-${nextDay}` }" class="btn btn-sm">Today</NuxtLink>
				<SeasonSelect :seasons="data.seasons" :season-id="data.season.id" />
			</div>
		</div>

		<progress class="progress h-1" :value="allDays.filter(([day]) => day < today()).length" :max="allDays.length" aria-label="Season progress"></progress>

		<!-- Centered and scrolls sideways once wider than the screen, like the page tabs in the layout -->
		<div role="tablist" class="tabs tabs-box flex-nowrap justify-center-safe overflow-x-auto scrollbar-none bg-transparent shadow-none">
			<button role="tab" class="tab" :class="{ 'tab-active shadow-md': !teamId }" @click="teamId = undefined">All</button>
			<button v-for="t in data.teams" :key="t.id" role="tab" class="tab" :class="{ 'tab-active shadow-md': teamId === t.id }" :title="t.name" @click="teamId = t.id">
				<TeamShirt :color="t.color" />
			</button>
		</div>

		<section v-for="[day, dayMatches] in days" :id="`day-${day}`" :key="day" class="card scroll-mt-36 bg-base-100 shadow-xl">
			<div class="card-body">
				<div>
					<p class="opacity-60">{{ dayMatches.some((m) => m.isPlayoff) ? "Playoffs" : "Match day" }}</p>
					<h2 class="card-title">{{ formatDate(day) }}</h2>
				</div>
				<ul class="list">
					<MatchRow v-for="m in dayMatches" :key="m.id" :match="m" :teams="data.teams" />
				</ul>
			</div>
		</section>

		<button class="btn fixed right-4 bottom-4 rounded-lg btn-square btn-neutral" aria-label="Scroll to top" @click="toTop">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 15l6-6 6 6" /></svg>
		</button>
	</div>
</template>
