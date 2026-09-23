// Fetches a season route for the season in ?season= (default: the newest). An unknown season shows the 404 page.
export async function useSeason<T extends "/api/season" | "/api/rosters">(url: T) {
	const route = useRoute();
	const { data, error } = await useFetch(url, { query: { id: computed(() => route.query.season) } });
	if (error.value) throw createError(error.value);
	return data;
}
