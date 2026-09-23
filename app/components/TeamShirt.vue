<script setup lang="ts">
// Team colors are CSS color names ("Yellow", "Grey"); the outline keeps light and dark shirts visible on every theme.
defineProps<{ color: string }>();
</script>

<template>
	<svg viewBox="0 0 24 24" class="size-6 shrink-0 stroke-base-content" :style="{ fill: color }" aria-hidden="true">
		<path stroke-width="1.5" stroke-linejoin="round" d="M8 3 3 5.5 1.5 10l3 1.5L6 10v11h12V10l1.5 1.5 3-1.5L21 5.5 16 3c0 1.7-1.8 3-4 3S8 4.7 8 3Z" />
	</svg>
</template>
