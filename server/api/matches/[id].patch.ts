import { eq } from "drizzle-orm";

// Staff of the match's league: set its score (both null = not played), and for admins its start time (a referee must send the start time it already has). Standings and playoff teams are computed from scores, so nothing else changes.
export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const [league] = await db
		.select({ slug: schema.leagues.slug, startsAt: schema.matches.startsAt })
		.from(schema.matches)
		.innerJoin(schema.seasons, eq(schema.seasons.id, schema.matches.seasonId))
		.innerJoin(schema.leagues, eq(schema.leagues.id, schema.seasons.leagueId))
		.where(eq(schema.matches.id, Number(getRouterParam(event, "id"))));
	if (!league) throw createError({ statusCode: 404, statusMessage: "Match not found" });
	const user = await requireLeague(event, ["admin", "referee"], league.slug);
	const { homeScore, awayScore, startsAt } = await readBody(event);
	if (user.role === "referee" && startsAt !== league.startsAt) throw createError({ statusCode: 403, statusMessage: "Referees can't change the start time" });
	const isScore = (s: unknown) => s === null || (Number.isInteger(s) && (s as number) >= 0);
	if (!isScore(homeScore) || !isScore(awayScore) || (homeScore === null) !== (awayScore === null) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:00$/.test(startsAt)) throw createError({ statusCode: 400, statusMessage: "Invalid score or start time" });

	const [match] = await db
		.update(schema.matches)
		.set({ homeScore, awayScore, startsAt })
		.where(eq(schema.matches.id, Number(getRouterParam(event, "id"))))
		.returning();
	if (!match) throw createError({ statusCode: 404, statusMessage: "Match not found" });
	return match;
});
