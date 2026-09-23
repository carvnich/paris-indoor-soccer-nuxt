import { desc } from "drizzle-orm";

export default defineEventHandler(() => {
	return db.select().from(schema.seasons).orderBy(desc(schema.seasons.name));
});
