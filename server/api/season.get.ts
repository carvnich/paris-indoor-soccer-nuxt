import { eq } from "drizzle-orm";

// One season's teams, standings and matches (playoff placeholders resolved), plus all seasons for the season picker. Defaults to the newest season.
export default defineEventHandler(async (event) => {
	const { season, seasons } = await findSeason(getQuery(event).id);
	const [teams, matches] = await Promise.all([db.select().from(schema.teams).where(eq(schema.teams.seasonId, season.id)), db.select().from(schema.matches).where(eq(schema.matches.seasonId, season.id)).orderBy(schema.matches.startsAt)]);
	const standings = computeStandings(teams, matches);
	// Seeds are only known once every regular-season game has a score
	const seeds = standings.map((t) => t.id);
	if (matches.every((m) => m.isPlayoff || m.homeScore !== null)) resolvePlayoffs(matches, seeds);

	return { season, seasons, teams, standings, matches };
});
