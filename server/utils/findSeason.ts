import { desc } from "drizzle-orm";

// All seasons (newest first) and the one with this id, or the newest when no id is given. 404 if it doesn't exist.
export async function findSeason(id?: unknown) {
	const seasons = await db.select().from(schema.seasons).orderBy(desc(schema.seasons.name));
	const season = id ? seasons.find((s) => s.id === Number(id)) : seasons[0];
	if (!season) throw createError({ statusCode: 404, statusMessage: "Season not found" });
	return { season, seasons };
}
