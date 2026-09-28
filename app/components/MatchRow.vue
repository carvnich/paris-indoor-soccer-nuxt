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
const toast = useState("toast", () => "");
// type="number" still accepts exponents, signs and decimals; scores are whole numbers
const digitsOnly = (e: KeyboardEvent) => "eE+-.,".includes(e.key) && e.preventDefault();

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
		toast.value = "Match updated";
		setTimeout(() => (toast.value = ""), 3000);
	} catch (e) {
		error.value = (e as { statusMessage?: string }).statusMessage ?? "Save failed";
	}
}
</script>

<template>
	<!-- DaisyUI list row: faded start time, match (grows), Edit for staff. The time and Edit columns are the same width (Edit's even when empty), so the match stays centered. -->
	<li class="list-row items-center gap-2">
		<div class="w-14 text-sm font-thin tabular-nums opacity-50 md:w-28 md:text-3xl">{{ formatTime(match.startsAt) }}</div>
		<div class="flex items-center gap-2">
			<div class="flex flex-1 items-center justify-end gap-2 text-right">
				<!-- Phones show only the shirt (like the table); playoff placeholders have no shirt, so their label always shows -->
				<span :class="{ 'max-md:hidden': home }">{{ home?.name ?? match.homeSlot }}</span>
				<TeamShirt v-if="home" :color="home.color" />
			</div>
			<!-- Score and "vs" share a size, so entering a score doesn't make the row taller -->
			<div class="w-16 text-center md:w-24 md:text-2xl" :class="played ? 'text-xl font-bold' : ' text-sm opacity-30'">{{ played ? `${match.homeScore} - ${match.awayScore}` : "vs" }}</div>
			<div class="flex flex-1 items-center gap-2">
				<TeamShirt v-if="away" :color="away.color" />
				<span :class="{ 'max-md:hidden': away }">{{ away?.name ?? match.awaySlot }}</span>
			</div>
		</div>
		<!-- Pencil icon (Lucide). rounded-lg: light and dark round fields by 2rem, which would make a small square a circle -->
		<div class="flex w-14 justify-end md:w-28">
			<button v-if="canEdit" class="btn rounded-lg btn-square btn-neutral btn-sm" aria-label="Edit match" @click="edit">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4" />
				</svg>
			</button>
		</div>

		<dialog v-if="canEdit" ref="dialog" class="modal">
			<form class="modal-box flex flex-col gap-2" @submit.prevent="save">
				<h3 class="text-lg font-bold">{{ home?.name ?? match.homeSlot }} vs {{ away?.name ?? match.awaySlot }}</h3>
				<div class="flex items-center gap-4">
					<TeamShirt v-if="home" :color="home.color" />
					<input v-model="form.homeScore" type="number" min="0" inputmode="numeric" class="input input-xl text-center text-3xl font-bold" aria-label="Home score" @keydown="digitsOnly" />
					-
					<input v-model="form.awayScore" type="number" min="0" inputmode="numeric" class="input input-xl text-center text-3xl font-bold" aria-label="Away score" @keydown="digitsOnly" />
					<TeamShirt v-if="away" :color="away.color" />
				</div>
				<input v-model="form.startsAt" type="datetime-local" class="input w-full" aria-label="Start time" required />
				<p v-if="error" class="text-error">{{ error }}</p>
				<div class="modal-action">
					<button type="button" class="btn flex-1 btn-lg" @click="dialog?.close()">Cancel</button>
					<button class="btn flex-1 btn-lg btn-primary">Save</button>
				</div>
			</form>
		</dialog>
	</li>
</template>
