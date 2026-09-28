<script setup lang="ts">
const route = useRoute();
const { data, error, refresh } = await useFetch("/api/downloads", { query: { league: computed(() => route.params.league) } });
if (error.value) throw createError(error.value);

// Admins upload (a file with the same name replaces the old one) and delete
const { user } = useUserSession();
const isAdmin = computed(() => user.value?.role === "admin");
const fileInput = ref<HTMLInputElement>();
const uploadError = ref("");
const toast = useState("toast", () => "");

function done(message: string) {
	refresh();
	toast.value = message;
	setTimeout(() => (toast.value = ""), 3000);
}

async function upload() {
	const body = new FormData();
	body.append("league", String(route.params.league));
	body.append("file", fileInput.value!.files![0]!);
	fileInput.value!.value = "";
	try {
		await $fetch("/api/downloads", { method: "POST", body });
		uploadError.value = "";
		done("File uploaded");
	} catch (e) {
		// ensureBlob errors carry message, not statusMessage
		uploadError.value = (e as { data?: { message?: string } }).data?.message ?? "Upload failed";
	}
}

async function remove(pathname: string, name: string) {
	if (!confirm(`Delete ${name}?`)) return;
	await $fetch("/api/downloads", { method: "DELETE", query: { pathname } });
	done("File deleted");
}
</script>

<template>
	<!-- A white card like Home's; a DaisyUI list: number (faded, like the match times), file icon + name (grows), then Download (and Delete for admins) as ghost buttons -->
	<section v-if="data" class="flex flex-col gap-4 rounded-box bg-base-100 p-4 shadow-xl">
		<div class="flex items-center justify-between gap-2">
			<h1 class="text-xl font-medium md:text-3xl">Downloads</h1>
			<template v-if="isAdmin">
				<!-- Phones: an upload icon (Lucide), the text kept for screen readers -->
				<button class="btn btn-sm btn-soft max-md:btn-square max-md:rounded-lg md:btn-md" @click="fileInput?.click()">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current md:hidden"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
					<span class="max-md:sr-only">Upload</span>
				</button>
				<input ref="fileInput" type="file" accept=".pdf,.csv,.docx,.xlsx" class="hidden" @change="upload" />
			</template>
		</div>
		<p v-if="uploadError" class="text-error">{{ uploadError }}</p>
		<ul class="list md:text-lg">
			<li v-for="(f, i) in data" :key="f.pathname" class="list-row items-center">
				<div class="text-sm font-thin tabular-nums opacity-50 md:text-3xl">{{ String(i + 1).padStart(2, "0") }}</div>
				<!-- File icon (Lucide file-text) -->
				<div class="flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-5 shrink-0 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
					</svg>
					<span class="text-xs md:text-lg wrap-break-word">{{ f.name }}</span>
				</div>
				<!-- Download and trash icons (Lucide). rounded-lg: light and dark round buttons by 2rem, which would make a small square a circle -->
				<div class="flex">
					<a :href="`/downloads/${route.params.league}/${encodeURIComponent(f.name)}`" download class="btn rounded-lg btn-square btn-ghost btn-sm" :aria-label="`Download ${f.name}`">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" /></svg>
					</a>
					<button v-if="isAdmin" class="btn rounded-lg btn-square btn-ghost btn-sm" :aria-label="`Delete ${f.name}`" @click="remove(f.pathname, f.name)">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="size-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
					</button>
				</div>
			</li>
			<li v-if="!data.length" class="list-row opacity-50">No files yet</li>
		</ul>
	</section>
</template>
