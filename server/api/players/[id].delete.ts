import { and, eq } from "drizzle-orm";

// Admin: take a player off their team for one season (?seasonId=). A player left with no seasons is deleted, photo included.
export default defineEventHandler(async (event) => {
	await requireUserSession(event, { user: { role: "admin" } });
	const playerId = Number(getRouterParam(event, "id"));
	const [roster] = await db
		.delete(schema.rosters)
		.where(and(eq(schema.rosters.playerId, playerId), eq(schema.rosters.seasonId, Number(getQuery(event).seasonId))))
		.returning();
	if (!roster) throw createError({ statusCode: 404, statusMessage: "Player not on a team this season" });

	const [otherSeason] = await db.select().from(schema.rosters).where(eq(schema.rosters.playerId, playerId)).limit(1);
	if (otherSeason) return;
	const [player] = await db.delete(schema.players).where(eq(schema.players.id, playerId)).returning();
	if (player?.imageKey) await blob.del(player.imageKey);
});
