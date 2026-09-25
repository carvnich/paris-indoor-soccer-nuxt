<script setup lang="ts">
import type * as schema from "~~/server/db/schema";

const props = defineProps<{ match: typeof schema.matches.$inferSelect; teams: (typeof schema.teams.$inferSelect)[] }>();
const home = computed(() => props.teams.find((t) => t.id === props.match.homeTeamId));
const away = computed(() => props.teams.find((t) => t.id === props.match.awayTeamId));
const played = computed(() => props.match.homeScore !== null && props.match.awayScore !== null);

// Admins and referees edit the score and start time in a dialog. A cleared number input is "", which means not played.
const { user } = useUserSession();
const canEdit = computed(() => user.value?.role === "admin" || user.value?.role === "referee");
const dialog = ref<HTMLDialogElement>();
const form = reactive<{ homeScore: number | "" | null; awayScore: number | "" | null; startsAt: string }>({ homeScore: null, awayScore: null, startsAt: "" });
const error = ref("");

function edit() {
	Object.assign(form, { homeScore: props.match.homeScore, awayScore: props.match.awayScore, startsAt: props.match.startsAt.slice(0, 16) });
	error.value = "";
	dialog.value?.showModal();
}

async function save() {
	try {
		await $fetch(`/api/matches/${props.match.id}`, { method: "PATCH", body: { homeScore: form.homeScore === "" ? null : form.homeScore, awayScore: form.awayScore === "" ? null : form.awayScore, startsAt: `${form.startsAt}:00` } });
		dialog.value?.close();
		// Standings and playoff teams depend on every score
		await refreshNuxtData();
	} catch (e) {
		error.value = (e as { statusMessage?: string }).statusMessage ?? "Save failed";
	}
}
</script>

<template>
	<div class="flex items-center">
		<div class="flex flex-1 items-center justify-end gap-2 text-right">
			{{ home?.name ?? match.homeSlot }}
			<TeamShirt v-if="home" :color="home.color" />
		</div>
		<!-- Fixed height (score + time), so entering a score doesn't make the row taller -->
		<div class="flex h-10 w-24 flex-col justify-center text-center">
			<div v-if="played" class="text-xl/6 font-bold">{{ match.homeScore }} - {{ match.awayScore }}</div>
			<div :class="played ? 'text-sm/4 opacity-60' : 'text-base font-medium'">{{ formatTime(match.startsAt) }}</div>
		</div>
		<div class="flex flex-1 items-center gap-2">
			<TeamShirt v-if="away" :color="away.color" />
			{{ away?.name ?? match.awaySlot }}
		</div>
		<!-- Pencil icon (Lucide) at the end of the row, so it doesn't make the row taller -->
		<button v-if="canEdit" class="btn ml-4 btn-circle btn-neutral btn-sm" aria-label="Edit match" @click="edit">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4" />
			</svg>
		</button>

		<dialog v-if="canEdit" ref="dialog" class="modal">
			<form class="modal-box flex flex-col gap-2" @submit.prevent="save">
				<h3 class="text-lg font-bold">{{ home?.name ?? match.homeSlot }} vs {{ away?.name ?? match.awaySlot }}</h3>
				<div class="flex items-center gap-2">
					<input v-model="form.homeScore" type="number" min="0" class="input" aria-label="Home score" />
					-
					<input v-model="form.awayScore" type="number" min="0" class="input" aria-label="Away score" />
				</div>
				<input v-model="form.startsAt" type="datetime-local" class="input w-full" aria-label="Start time" required />
				<p v-if="error" class="text-error">{{ error }}</p>
				<div class="modal-action">
					<button type="button" class="btn" @click="dialog?.close()">Cancel</button>
					<button class="btn btn-primary">Save</button>
				</div>
			</form>
		</dialog>
	</div>
</template>
