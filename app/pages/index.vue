<script setup lang="ts">
// Placeholder home page: proves DaisyUI styling and the database round-trip.
const { data: seasons } = await useFetch("/api/seasons");
</script>

<template>
	<main class="mx-auto max-w-xl p-6">
		<div class="card bg-base-200">
			<div class="card-body">
				<h1 class="card-title">Paris Indoor Soccer</h1>
				<ul v-if="seasons?.length" class="list">
					<li v-for="season in seasons" :key="season.id" class="list-row">
						{{ season.name }}
						<span v-if="season.isCurrent" class="badge badge-primary">Current</span>
					</li>
				</ul>
				<p v-else>No seasons yet. Run the db:seed task.</p>
			</div>
		</div>
	</main>
</template>
