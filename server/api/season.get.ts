// One league's season: teams, standings and matches (playoff placeholders resolved), plus the league's seasons for the season picker. Defaults to the newest season.
export default defineEventHandler((event) => {
	const { league, season } = getQuery(event);
	return loadSeason(league, season);
});
