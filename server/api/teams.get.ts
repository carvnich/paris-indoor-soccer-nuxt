import { eq } from "drizzle-orm";

// Just a league's seasons and one season's teams (default: the newest), for the header's season picker and Follow list. Season pages are heavier: they carry every match too.
export default defineEventHandler(async (event) => {
	const { league, season } = getQuery(event);
	const [{ seasons }, teams] = await Promise.all([
		findSeason(league, season),
		db
			.select()
			.from(schema.teams)
			.where(eq(schema.teams.seasonId, seasonId(league, season))),
	]);
	return { seasons, teams };
});
