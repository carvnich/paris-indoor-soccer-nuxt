// One league's season: teams, standings and matches (playoff placeholders resolved), plus the league's seasons for the season picker. Defaults to the newest season. Admins and referees who may manage this league get real scores; everyone else gets the capped ones (see loadSeason).
export default defineEventHandler(async (event) => {
	const { league, season } = getQuery(event);
	const user = (await getUserSession(event))?.user as Parameters<typeof canManage>[0];
	return loadSeason(league, season, canManage(user, ["admin", "referee"], String(league)));
});
