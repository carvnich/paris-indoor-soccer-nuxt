import { desc } from "drizzle-orm";

// All seasons (newest first) and the one named in the URL ("2026-2027" = "2026/2027"), or the newest when none is given. 404 if it doesn't exist.
export async function findSeason(slug?: unknown) {
	const seasons = await db.select().from(schema.seasons).orderBy(desc(schema.seasons.name));
	const season = slug ? seasons.find((s) => s.name === String(slug).replace("-", "/")) : seasons[0];
	if (!season) throw createError({ statusCode: 404, statusMessage: "Season not found" });
	return { season, seasons };
}
