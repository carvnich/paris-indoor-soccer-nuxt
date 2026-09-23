import { eq } from "drizzle-orm";

// Current season's teams and the players on each.
export default defineEventHandler(async () => {
	const [season] = await db.select().from(schema.seasons).where(eq(schema.seasons.isCurrent, true));
	if (!season) throw createError({ statusCode: 404, statusMessage: "No current season" });

	const [teams, players] = await Promise.all([
		db.select().from(schema.teams).where(eq(schema.teams.seasonId, season.id)),
		db
			.select({ id: schema.players.id, firstName: schema.players.firstName, lastName: schema.players.lastName, teamId: schema.rosters.teamId })
			.from(schema.rosters)
			.innerJoin(schema.players, eq(schema.players.id, schema.rosters.playerId))
			.where(eq(schema.rosters.seasonId, season.id))
			.orderBy(schema.players.lastName),
	]);

	return { season, teams, players };
});
