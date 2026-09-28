import { eq } from "drizzle-orm";

// One league's season: teams, standings and matches (playoff placeholders resolved), plus the league's seasons for the season picker. Defaults to the newest season.
export default defineEventHandler(async (event) => {
	const { league: leagueSlug, season: slug } = getQuery(event);
	const [{ league, season, seasons }, teams, matches] = await Promise.all([
		findSeason(leagueSlug, slug),
		db
			.select()
			.from(schema.teams)
			.where(eq(schema.teams.seasonId, seasonId(leagueSlug, slug))),
		db
			.select()
			.from(schema.matches)
			.where(eq(schema.matches.seasonId, seasonId(leagueSlug, slug)))
			.orderBy(schema.matches.startsAt),
	]);
	const standings = computeStandings(teams, matches);
	// Seeds are only known once every regular-season game has a score
	const seeds = standings.map((t) => t.id);
	if (matches.every((m) => m.isPlayoff || m.homeScore !== null)) playoffFormats[league.playoffFormat](matches, seeds);

	return { season, seasons, teams, standings, matches };
});
