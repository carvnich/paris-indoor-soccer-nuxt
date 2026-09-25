import { eq } from "drizzle-orm";

// One season's teams, standings and matches (playoff placeholders resolved), plus all seasons for the season picker. Defaults to the newest season.
export default defineEventHandler(async (event) => {
	const slug = getQuery(event).season;
	const [{ season, seasons }, teams, matches] = await Promise.all([
		findSeason(slug),
		db
			.select()
			.from(schema.teams)
			.where(eq(schema.teams.seasonId, seasonId(slug))),
		db
			.select()
			.from(schema.matches)
			.where(eq(schema.matches.seasonId, seasonId(slug)))
			.orderBy(schema.matches.startsAt),
	]);
	const standings = computeStandings(teams, matches);
	// Seeds are only known once every regular-season game has a score
	const seeds = standings.map((t) => t.id);
	if (matches.every((m) => m.isPlayoff || m.homeScore !== null)) resolvePlayoffs(matches, seeds);

	return { season, seasons, teams, standings, matches };
});
