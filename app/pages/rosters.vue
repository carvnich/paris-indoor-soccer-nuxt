<script setup lang="ts">
const data = await useSeason("/api/rosters");
// First team selected, again after a season change
const teamId = ref(data.value?.teams[0]?.id);
watch(data, () => (teamId.value = data.value?.teams[0]?.id));
const players = computed(() => data.value?.players.filter((p) => p.teamId === teamId.value) ?? []);

// Admins add and edit players in one dialog. Adding can pick a returning player (not on a team this season) instead of a new name.
const { user } = useUserSession();
const dialog = ref<HTMLDialogElement>();
const form = reactive<{ id?: number; firstName: string; lastName: string; teamId?: number; photo: Blob | null; removePhoto: boolean }>({ firstName: "", lastName: "", photo: null, removePhoto: false });
const error = ref("");
const player = computed(() => data.value?.players.find((p) => p.id === form.id));
const returning = computed(() => data.value?.players.filter((p) => p.teamId === null) ?? []);
const preview = computed(() => (form.photo ? URL.createObjectURL(form.photo) : !form.removePhoto && player.value?.imageKey ? `/photos/${player.value.imageKey}` : null));

function open(p?: { id: number; firstName: string; lastName: string }) {
	Object.assign(form, { id: p?.id, firstName: p?.firstName ?? "", lastName: p?.lastName ?? "", teamId: teamId.value, photo: null, removePhoto: false });
	error.value = "";
	dialog.value?.showModal();
}

// ~800px wide, WebP (Safari can't encode WebP, so it gets JPEG)
async function resize(file: File) {
	const image = await createImageBitmap(file);
	const scale = Math.min(1, 800 / image.width);
	const canvas = new OffscreenCanvas(Math.round(image.width * scale), Math.round(image.height * scale));
	canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
	const webp = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
	return webp.type === "image/webp" ? webp : canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
}

async function pickPhoto(file: File) {
	try {
		form.photo = await resize(file);
	} catch {
		error.value = "Can't read that image";
	}
}

async function send(request: () => unknown) {
	try {
		await request();
		dialog.value?.close();
		await refreshNuxtData();
	} catch (e) {
		error.value = (e as { data?: { message?: string } }).data?.message ?? "Save failed";
	}
}

function save() {
	const body = new FormData();
	body.set("firstName", form.firstName);
	body.set("lastName", form.lastName);
	body.set("teamId", String(form.teamId));
	if (form.id) body.set("id", String(form.id));
	if (form.photo) body.set("photo", form.photo);
	if (form.removePhoto) body.set("removePhoto", "1");
	return send(() => $fetch("/api/players", { method: "POST", body }));
}

function remove() {
	if (confirm(`Take ${form.firstName} ${form.lastName} off the team for ${data.value!.season.name}?`)) return send(() => $fetch(`/api/players/${form.id!}`, { method: "DELETE", query: { seasonId: data.value!.season.id } }));
}
</script>

<template>
	<div v-if="data" class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-2">
			<h1 class="text-2xl font-bold">Rosters</h1>
			<SeasonSelect :seasons="data.seasons" :season-id="data.season.id" />
		</div>

		<div role="tablist" class="tabs tabs-box">
			<button v-for="t in data.teams" :key="t.id" role="tab" class="tab gap-2" :class="{ 'tab-active': teamId === t.id }" @click="teamId = t.id">
				<TeamShirt :color="t.color" />
				<span class="hidden md:inline">{{ t.name }}</span>
			</button>
		</div>

		<button v-if="user?.role === 'admin' && teamId" class="btn btn-primary self-end" @click="open()">Add player</button>

		<div class="grid gap-4 md:grid-cols-2">
			<div v-for="p in players" :key="p.id" class="flex items-center gap-4 rounded-box bg-base-200 p-4">
				<div class="avatar" :class="{ 'avatar-placeholder': !p.imageKey }">
					<div class="w-16 rounded-full bg-neutral text-neutral-content">
						<img v-if="p.imageKey" :src="`/photos/${p.imageKey}`" :alt="`${p.firstName} ${p.lastName}`" loading="lazy" />
						<span v-else>{{ p.firstName[0] }}{{ p.lastName[0] }}</span>
					</div>
				</div>
				<span class="flex-1 text-lg">{{ p.firstName }} {{ p.lastName }}</span>
				<button v-if="user?.role === 'admin'" class="btn btn-ghost btn-sm" @click="open(p)">Edit</button>
			</div>
		</div>
		<p v-if="!players.length" class="py-8 text-center opacity-60">No players on this team yet.</p>

		<dialog v-if="user?.role === 'admin'" ref="dialog" class="modal">
			<form class="modal-box flex flex-col gap-2" @submit.prevent="save">
				<h3 class="text-lg font-bold">{{ player?.teamId ? "Edit player" : "Add player" }}</h3>
				<select v-if="!player?.teamId" v-model="form.id" class="select w-full" aria-label="Returning player" @change="Object.assign(form, { firstName: player?.firstName ?? '', lastName: player?.lastName ?? '' })">
					<option :value="undefined">New player</option>
					<option v-for="p in returning" :key="p.id" :value="p.id">{{ p.firstName }} {{ p.lastName }}</option>
				</select>
				<input v-model="form.firstName" class="input w-full" placeholder="First name" aria-label="First name" required />
				<input v-model="form.lastName" class="input w-full" placeholder="Last name" aria-label="Last name" required />
				<select v-model="form.teamId" class="select w-full" aria-label="Team">
					<option v-for="t in data.teams" :key="t.id" :value="t.id">{{ t.name }} ({{ t.color }})</option>
				</select>
				<div class="flex items-center gap-2">
					<div v-if="preview" class="avatar">
						<div class="w-16 rounded-full"><img :src="preview" alt="Photo" /></div>
					</div>
					<input type="file" accept="image/*" class="file-input w-full" aria-label="Photo" @change="pickPhoto(($event.target as HTMLInputElement).files![0]!)" />
					<button v-if="preview" type="button" class="btn btn-ghost btn-sm" @click="Object.assign(form, { photo: null, removePhoto: true })">Remove photo</button>
				</div>
				<p v-if="error" class="text-error">{{ error }}</p>
				<div class="modal-action">
					<button v-if="player?.teamId" type="button" class="btn btn-error me-auto" @click="remove">Remove</button>
					<button type="button" class="btn" @click="dialog?.close()">Cancel</button>
					<button class="btn btn-primary">Save</button>
				</div>
			</form>
		</dialog>
	</div>
</template>
