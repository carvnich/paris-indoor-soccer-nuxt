// Every league, for the league picker
export default defineEventHandler(() => db.select({ slug: schema.leagues.slug, name: schema.leagues.name }).from(schema.leagues).orderBy(schema.leagues.id));
