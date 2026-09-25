// Fetches a season route for the season in ?season= (default: the newest). An unknown season shows the 404 page.
// Returning to a page (or season) shows its last data at once and refreshes it in the background; by default Nuxt drops the data on leaving, so every tab switch waited for the server.
export async function useSeason<T extends "/api/season" | "/api/rosters">(url: T) {
	const route = useRoute();
	const { data, error } = await useFetch(url, {
		query: { season: computed(() => route.query.season) },
		getCachedData(key, nuxtApp, { cause }) {
			if (cause !== "initial") return;
			if (!nuxtApp.isHydrating && nuxtApp.payload.data[key]) nextTick(() => refreshNuxtData(key));
			return nuxtApp.payload.data[key];
		},
	});
	if (error.value) throw createError(error.value);
	return data;
}
