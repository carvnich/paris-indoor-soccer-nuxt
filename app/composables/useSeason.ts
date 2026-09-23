// Fetches a season route for the season in ?season= (default: the newest).
export async function useSeason<T extends "/api/season" | "/api/rosters">(url: T) {
	const route = useRoute();
	const { data } = await useFetch(url, { query: { id: computed(() => route.query.season) } });
	return data;
}
