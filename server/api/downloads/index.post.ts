import { eq } from "drizzle-orm";

// Admin: add a file to a league's downloads. A file with the same name replaces the old one.
// PDF, CSV, Word (.docx) and Excel (.xlsx). Windows reports CSV files as application/vnd.ms-excel when Excel is installed.
export default defineEventHandler(async (event) => {
	await requireUserSession(event, { user: { role: "admin" } });
	const form = await readFormData(event);
	const league = String(form.get("league"));
	const file = form.get("file");
	const [found] = await db.select().from(schema.leagues).where(eq(schema.leagues.slug, league));
	if (!found || !(file instanceof File)) throw createError({ statusCode: 400, statusMessage: "League and file are required" });
	ensureBlob(file, { maxSize: "8MB", types: ["pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] });
	return blob.put(file.name, file, { prefix: `downloads/${league}` });
});
