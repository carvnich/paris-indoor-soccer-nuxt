// 2024/25 and 2025/26 (Friday co-ed) are left out until they're migrated to D1 (their files stay for that and for the tests).
import fridayCoed2026 from "../../db/seed/friday-coed-2026-2027.json";
// From the league's PDF schedule (v.2). Weeks 22–23 are left out: they don't count in the standings and only hold make-up games (staff move a cancelled game there).
import sundayWomen2026 from "../../db/seed/sunday-women-2026-2027.json";

// Shape of the legacy MongoDB `matches` documents. A `mongoexport --jsonArray`
// of that collection has the same shape and can replace these files.
interface LegacySide {
	team: string;
	color: string;
	score?: number | null;
}
interface LegacyMatch {
	matchId: string;
	dateTime: string;
	season: string;
	homeTeam: LegacySide;
	awayTeam: LegacySide;
	isPlayoff: boolean;
}

const leagues: { slug: string; name: string; playoffFormat: "six-team" | "eight-team"; matches: LegacyMatch[] }[] = [
	{ slug: "friday-coed", name: "Friday Co-ed", playoffFormat: "six-team", matches: fridayCoed2026 },
	{ slug: "sunday-women", name: "Sunday Women's", playoffFormat: "eight-team", matches: sundayWomen2026 },
];

export default defineTask({
	meta: { name: "db:seed", description: "Import leagues, seasons, teams and matches. Safe to re-run: existing rows are updated." },
	async run() {
		const seasonIds = new Map<string, number>();
		const teamIds = new Map<string, number>();
		let matches = 0;

		// Placeholder sides ("3rd", "Highest seed") have color "TBD" and no team yet.
		async function resolveSide(seasonId: number, side: LegacySide) {
			if (side.color === "TBD") return { teamId: null, slot: side.team };
			const key = `${seasonId}|${side.color}`;
			if (!teamIds.has(key)) {
				const [team] = await db
					.insert(schema.teams)
					.values({ seasonId, name: side.team, color: side.color })
					.onConflictDoUpdate({ target: [schema.teams.seasonId, schema.teams.color], set: { name: side.team } })
					.returning();
				teamIds.set(key, team!.id);
			}
			return { teamId: teamIds.get(key)!, slot: null };
		}

		for (const { matches: legacyMatches, ...league } of leagues) {
			const [row] = await db.insert(schema.leagues).values(league).onConflictDoUpdate({ target: schema.leagues.slug, set: league }).returning();
			const leagueId = row!.id;
			for (const name of new Set(legacyMatches.map((m) => m.season))) {
				const [season] = await db
					.insert(schema.seasons)
					.values({ leagueId, name })
					.onConflictDoUpdate({ target: [schema.seasons.leagueId, schema.seasons.name], set: { name } })
					.returning();
				seasonIds.set(`${leagueId}|${name}`, season!.id);
			}

			for (const m of legacyMatches) {
				const seasonId = seasonIds.get(`${leagueId}|${m.season}`)!;
				const home = await resolveSide(seasonId, m.homeTeam);
				const away = await resolveSide(seasonId, m.awayTeam);
				const values = { code: m.matchId, seasonId, startsAt: m.dateTime, homeTeamId: home.teamId, homeSlot: home.slot, awayTeamId: away.teamId, awaySlot: away.slot, homeScore: m.homeTeam.score ?? null, awayScore: m.awayTeam.score ?? null, isPlayoff: m.isPlayoff };
				await db.insert(schema.matches).values(values).onConflictDoUpdate({ target: schema.matches.code, set: values });
			}
			matches += legacyMatches.length;
		}

		return { result: { leagues: leagues.length, seasons: seasonIds.size, teams: teamIds.size, matches } };
	},
});
