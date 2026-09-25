import { and, eq } from "drizzle-orm";

// One season's teams and every player; teamId is the player's team this season (null = not on a team, e.g. a returning player not yet placed).
// Plus all seasons for the season picker. Defaults to the newest season.
export default defineEventHandler(async (event) => {
	const slug = getQuery(event).season;
	const [{ season, seasons }, teams, players] = await Promise.all([
		findSeason(slug),
		db
			.select()
			.from(schema.teams)
			.where(eq(schema.teams.seasonId, seasonId(slug))),
		db
			.select({ id: schema.players.id, firstName: schema.players.firstName, lastName: schema.players.lastName, imageKey: schema.players.imageKey, teamId: schema.rosters.teamId })
			.from(schema.players)
			.leftJoin(schema.rosters, and(eq(schema.rosters.playerId, schema.players.id), eq(schema.rosters.seasonId, seasonId(slug))))
			.orderBy(schema.players.lastName),
	]);

	return { season, seasons, teams, players };
});
