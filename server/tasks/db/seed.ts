import matches2024 from "../../db/seed/matches-2024-2025.json";
import matches2025 from "../../db/seed/matches-2025-2026.json";

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

const legacyMatches: LegacyMatch[] = [...matches2024, ...matches2025];

export default defineTask({
	meta: { name: "db:seed", description: "Import legacy seasons, teams and matches. Safe to re-run: existing rows are updated." },
	async run() {
		const seasonIds = new Map<string, number>();
		for (const name of new Set(legacyMatches.map((m) => m.season))) {
			const [season] = await db.insert(schema.seasons).values({ name }).onConflictDoUpdate({ target: schema.seasons.name, set: { name } }).returning();
			seasonIds.set(name, season!.id);
		}

		// Placeholder sides ("3rd", "Highest seed") have color "TBD" and no team yet.
		const teamIds = new Map<string, number>();
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

		for (const m of legacyMatches) {
			const seasonId = seasonIds.get(m.season)!;
			const home = await resolveSide(seasonId, m.homeTeam);
			const away = await resolveSide(seasonId, m.awayTeam);
			const values = { code: m.matchId, seasonId, startsAt: m.dateTime, homeTeamId: home.teamId, homeSlot: home.slot, awayTeamId: away.teamId, awaySlot: away.slot, homeScore: m.homeTeam.score ?? null, awayScore: m.awayTeam.score ?? null, isPlayoff: m.isPlayoff };
			await db.insert(schema.matches).values(values).onConflictDoUpdate({ target: schema.matches.code, set: values });
		}

		return { result: { seasons: seasonIds.size, teams: teamIds.size, matches: legacyMatches.length } };
	},
});
