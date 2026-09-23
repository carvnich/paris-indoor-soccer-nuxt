<script setup lang="ts">
// Switches season through the ?season= query, so the choice survives reloads and links.
defineProps<{ seasonId: number }>();
const { data: seasons } = await useFetch("/api/seasons");
</script>

<template>
	<select class="select select-sm w-auto" aria-label="Season" @change="navigateTo({ query: { season: ($event.target as HTMLSelectElement).value } })">
		<option v-for="s in seasons" :key="s.id" :value="s.id" :selected="s.id === seasonId">{{ s.name }}</option>
	</select>
</template>
