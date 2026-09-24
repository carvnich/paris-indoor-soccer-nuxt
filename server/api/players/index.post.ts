import { eq } from "drizzle-orm";

// Admin: create a player (no id) or update one, put them on a team for that team's season, and replace or remove their photo.
// Photos arrive already resized by the browser (WebP, or JPEG where the browser can't encode WebP).
export default defineEventHandler(async (event) => {
	await requireUserSession(event, { user: { role: "admin" } });
	const form = await readFormData(event);
	const id = Number(form.get("id")) || undefined;
	const firstName = String(form.get("firstName") ?? "").trim();
	const lastName = String(form.get("lastName") ?? "").trim();
	const photo = form.get("photo");
	const [team] = await db
		.select()
		.from(schema.teams)
		.where(eq(schema.teams.id, Number(form.get("teamId"))));
	if (!firstName || !lastName || !team) throw createError({ statusCode: 400, statusMessage: "Name and team are required" });
	if (photo instanceof File) ensureBlob(photo, { maxSize: "1MB", types: ["image/webp", "image/jpeg"] });
	const [old] = id ? await db.select().from(schema.players).where(eq(schema.players.id, id)) : [];
	if (id && !old) throw createError({ statusCode: 404, statusMessage: "Player not found" });

	// A random suffix gives every upload a new URL, so photos can be cached forever
	const imageKey = photo instanceof File ? (await blob.put(`photo.${photo.type.split("/")[1]}`, photo, { prefix: "players", addRandomSuffix: true })).pathname : form.get("removePhoto") ? null : (old?.imageKey ?? null);
	const [player] = id ? await db.update(schema.players).set({ firstName, lastName, imageKey }).where(eq(schema.players.id, id)).returning() : await db.insert(schema.players).values({ firstName, lastName, imageKey }).returning();
	if (old?.imageKey && old.imageKey !== imageKey) await blob.del(old.imageKey);

	await db
		.insert(schema.rosters)
		.values({ seasonId: team.seasonId, playerId: player!.id, teamId: team.id })
		.onConflictDoUpdate({ target: [schema.rosters.seasonId, schema.rosters.playerId], set: { teamId: team.id } });
	return player;
});
