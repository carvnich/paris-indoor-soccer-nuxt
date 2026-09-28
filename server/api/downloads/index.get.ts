import { eq } from "drizzle-orm";

// One league's files: everything in the blob folder downloads/<league>/, named by file name. 404 for an unknown league.
export default defineEventHandler(async (event) => {
	const league = String(getQuery(event).league);
	const prefix = `downloads/${league}/`;
	const [[found], { blobs }] = await Promise.all([db.select().from(schema.leagues).where(eq(schema.leagues.slug, league)), blob.list({ prefix })]);
	if (!found) throw createError({ statusCode: 404, statusMessage: "League not found" });
	return blobs.map((b) => ({ pathname: b.pathname, name: b.pathname.slice(prefix.length) }));
});
