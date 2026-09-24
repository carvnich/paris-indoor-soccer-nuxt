import { eq } from "drizzle-orm";

// One season's teams and the players on each, plus all seasons for the season picker. Defaults to the newest season.
export default defineEventHandler(async (event) => {
	const { season, seasons } = await findSeason(getQuery(event).season);
	const [teams, players] = await Promise.all([
		db.select().from(schema.teams).where(eq(schema.teams.seasonId, season.id)),
		db
			.select({ id: schema.players.id, firstName: schema.players.firstName, lastName: schema.players.lastName, teamId: schema.rosters.teamId })
			.from(schema.rosters)
			.innerJoin(schema.players, eq(schema.players.id, schema.rosters.playerId))
			.where(eq(schema.rosters.seasonId, season.id))
			.orderBy(schema.players.lastName),
	]);

	return { season, seasons, teams, players };
});
