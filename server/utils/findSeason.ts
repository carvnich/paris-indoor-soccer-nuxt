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
