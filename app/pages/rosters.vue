<script setup lang="ts">
const { data } = await useFetch("/api/rosters");
const teamId = ref(data.value?.teams[0]?.id);
const players = computed(() => data.value?.players.filter((p) => p.teamId === teamId.value) ?? []);
</script>

<template>
	<div v-if="data" class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold">Rosters {{ data.season.name }}</h1>

		<div role="tablist" class="tabs tabs-box">
			<button v-for="t in data.teams" :key="t.id" role="tab" class="tab gap-2" :class="{ 'tab-active': teamId === t.id }" @click="teamId = t.id">
				<TeamShirt :color="t.color" />
				<span class="hidden md:inline">{{ t.name }}</span>
			</button>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div v-for="p in players" :key="p.id" class="flex items-center gap-4 rounded-box bg-base-200 p-4">
				<div class="avatar avatar-placeholder">
					<div class="w-16 rounded-full bg-neutral text-neutral-content">{{ p.firstName[0] }}{{ p.lastName[0] }}</div>
				</div>
				<span class="text-lg">{{ p.firstName }} {{ p.lastName }}</span>
			</div>
		</div>
		<p v-if="!players.length" class="py-8 text-center opacity-60">No players on this team yet.</p>
	</div>
</template>
