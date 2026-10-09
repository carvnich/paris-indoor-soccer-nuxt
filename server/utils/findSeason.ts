import { and, desc, eq } from "drizzle-orm";

// A league (by slug) with all its seasons (newest first) and the one named in the URL ("2026-2027" = "2026/2027"), or the newest when none is given. 404 if either doesn't exist.
export async function findSeason(league: unknown, slug?: unknown) {
	const rows = await db
		.select({ league: schema.leagues, season: schema.seasons })
		.from(schema.seasons)
		.innerJoin(schema.leagues, eq(schema.leagues.id, schema.seasons.leagueId))
		.where(eq(schema.leagues.slug, String(league)))
		.orderBy(desc(schema.seasons.name));
	const seasons = rows.map((r) => r.season);
	const season = slug ? seasons.find((s) => s.name === String(slug).replace("-", "/")) : seasons[0];
	if (!season) throw createError({ statusCode: 404, statusMessage: "Season not found" });
	return { league: rows[0]!.league, season, seasons };
}

// The same season's id as a subquery, so a route's own queries run alongside findSeason instead of after it (one database round trip, not two)
export const seasonId = (league: unknown, slug?: unknown) =>
	db
		.select({ id: schema.seasons.id })
		.from(schema.seasons)
		.innerJoin(schema.leagues, eq(schema.leagues.id, schema.seasons.leagueId))
		.where(and(eq(schema.leagues.slug, String(league)), slug ? eq(schema.seasons.name, String(slug).replace("-", "/")) : undefined))
		.orderBy(desc(schema.seasons.name))
		.limit(1);

// A season's teams, standings and matches (playoff placeholders resolved), for the season page and the team calendars
export async function loadSeason(leagueSlug: unknown, slug?: unknown) {
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
	// Playoff teams follow the standings as they stand, so they change as scores come in (until then, teams level on points keep their database order)
	playoffFormats[league.playoffFormat](
		matches,
		standings.map((t) => t.id),
	);
	return { league, season, seasons, teams, standings, matches };
}
