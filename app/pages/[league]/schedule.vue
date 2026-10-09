<script setup lang="ts">
// The season's matches as one DaisyUI list, a date row above each day's matches
const route = useRoute();
const data = await useSeason("/api/season");

const teamId = ref<number>();
watch(
	() => [route.params.league, route.query.season],
	() => (teamId.value = undefined),
);
const days = computed(() => groupByDay((data.value?.matches ?? []).filter((m) => !teamId.value || m.homeTeamId === teamId.value || m.awayTeamId === teamId.value)));
const nextDay = computed(() => days.value[nextDayIndex(days.value)]?.[0]);
// Season progress: match days before today out of all match days, playoffs included, whatever the team filter
const allDays = computed(() => groupByDay(data.value?.matches ?? []));
// Opens on the next match day (the closest date), whatever the scroll position was before a refresh
onMounted(() => document.getElementById(`day-${nextDay.value}`)?.scrollIntoView());
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>

<template>
	<div v-if="data" class="flex flex-col gap-6">
		<progress class="progress h-1" :value="allDays.filter(([day]) => day < today()).length" :max="allDays.length" aria-label="Season progress"></progress>

		<!-- Centered and scrolls sideways once wider than the screen, like the page tabs in the layout -->
		<div role="tablist" class="tabs tabs-box flex-nowrap justify-center-safe overflow-x-auto scrollbar-none bg-transparent shadow-none">
			<button role="tab" class="tab" :class="{ 'tab-active shadow-md': !teamId }" @click="teamId = undefined">All</button>
			<button v-for="t in data.teams" :key="t.id" role="tab" class="tab" :class="{ 'tab-active shadow-md': teamId === t.id }" :title="t.name" @click="teamId = t.id">
				<TeamShirt :color="t.color" />
			</button>
		</div>

		<!-- One card per match day. scroll-mt: a day jump stops 16px below the sticky tab bar. -->
		<MatchDayCard v-for="[day, dayMatches] in days" :id="`day-${day}`" :key="day" :date="day" :matches="dayMatches" :teams="data.teams" class="scroll-mt-16" />

		<!-- Clear of the browser toolbar at the bottom of phone screens -->
		<button class="btn btn-lg fixed right-10 bottom-10 btn-circle btn-primary" aria-label="Scroll to top" @click="toTop">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-10 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 15l6-6 6 6" /></svg>
		</button>
	</div>
</template>
