<script setup lang="ts">
import type * as schema from "~~/server/db/schema";

defineProps<{ day: string; matches: (typeof schema.matches.$inferSelect)[]; teams: (typeof schema.teams.$inferSelect)[] }>();
</script>

<template>
	<!-- White card of matches, with the square black date card overlapping its top edge (mt-8 keeps the square clear of what's above). Home puts arrows beside the date and a progress bar below the list. -->
	<section class="card mt-8 bg-base-100 shadow-xl">
		<div class="card-body gap-8 p-4">
			<div class="-mt-12 flex items-center justify-center gap-4">
				<slot name="prev" />
				<div class="flex size-28 items-center justify-center rounded-box bg-neutral text-neutral-content shadow-xl">
					<h2 class="text-2xl md:text-3xl">{{ formatDate(day) }}</h2>
				</div>
				<slot name="next" />
			</div>
			<ul class="list md:text-lg">
				<MatchRow v-for="m in matches" :key="m.id" :match="m" :teams="teams" />
			</ul>
			<slot />
		</div>
	</section>
</template>
