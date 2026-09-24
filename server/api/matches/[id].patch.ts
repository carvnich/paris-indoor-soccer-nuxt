import { eq } from "drizzle-orm";

// Admin or referee: set a match's score (both null = not played) and start time. Standings and playoff teams are computed from scores, so nothing else changes.
export default defineEventHandler(async (event) => {
	await requireUserSession(event, { user: { role: ["admin", "referee"] } });
	const { homeScore, awayScore, startsAt } = await readBody(event);
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
