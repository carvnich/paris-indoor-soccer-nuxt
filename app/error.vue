<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{ error: NuxtError }>();
</script>

<template>
	<NuxtLayout>
		<div class="flex flex-col items-center gap-4 py-16 text-center">
			<h1 class="text-5xl font-bold">{{ error.statusCode }}</h1>
			<p class="opacity-60">{{ error.statusCode === 404 ? "This page doesn't exist." : "Something went wrong." }}</p>
			<button class="btn btn-primary" @click="clearError({ redirect: '/' })">Back to home</button>
		</div>
	</NuxtLayout>
</template>
