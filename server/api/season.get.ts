import { eq } from "drizzle-orm";

// One season's teams, standings and matches (playoff placeholders resolved). Defaults to the current season.
export default defineEventHandler(async (event) => {
	const { id } = getQuery(event);
	const [season] = await db
		.select()
		.from(schema.seasons)
		.where(id ? eq(schema.seasons.id, Number(id)) : eq(schema.seasons.isCurrent, true));
	if (!season) throw createError({ statusCode: 404, statusMessage: "Season not found" });

	const teams = await db.select().from(schema.teams).where(eq(schema.teams.seasonId, season.id));
	const matches = await db.select().from(schema.matches).where(eq(schema.matches.seasonId, season.id)).orderBy(schema.matches.startsAt);
	const standings = computeStandings(teams, matches);
	// Seeds are only known once every regular-season game has a score
	const seeds = standings.map((t) => t.id);
	if (matches.every((m) => m.isPlayoff || m.homeScore !== null)) resolvePlayoffs(matches, seeds);

	return { season, teams, standings, matches };
});
