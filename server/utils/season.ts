// Pure functions (no auto-imports) so node can run them directly: see test/season.test.ts.
import type { leagues, matches, teams } from "../db/schema";

type Team = typeof teams.$inferSelect;
type Match = typeof matches.$inferSelect;

// Each league names its playoff format (leagues.playoffFormat). To change one league's format, add a function here and point only that league at it.
export const playoffFormats: Record<(typeof leagues.$inferSelect)["playoffFormat"], (matches: Match[], seeds: number[]) => void> = { "six-team": resolvePlayoffs, "eight-team": resolveEightTeamPlayoffs };

// Regular season only: 3 points a win, 1 a draw; ties broken by goal difference.
export function computeStandings(teams: Team[], matches: Match[]) {
	const rows = teams.map((t) => ({ ...t, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }));
	for (const m of matches) {
		if (m.isPlayoff || m.homeScore === null || m.awayScore === null) continue;
		for (const [id, gf, ga] of [
			[m.homeTeamId, m.homeScore, m.awayScore],
			[m.awayTeamId, m.awayScore, m.homeScore],
		] as const) {
			const row = rows.find((r) => r.id === id)!;
			row.played++;
			row.goalsFor += gf;
			row.goalsAgainst += ga;
			row.goalDifference += gf - ga;
			if (gf > ga) row.wins++;
			else if (gf < ga) row.losses++;
			else row.draws++;
		}
	}
	for (const r of rows) r.points = r.wins * 3 + r.draws;
	return rows.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
}

// Fills in playoff teams from placeholder slots, in place. `seeds` = team ids by final standing.
// "1st".."6th" are seeds. The two quarterfinal winners are re-ranked: 1st plays the "Lowest Seed",
// 2nd plays the "Highest seed". "Finals" is the winner of 1st's semi (home) vs 2nd's semi (away).
export function resolvePlayoffs(matches: Match[], seeds: number[]) {
	const games = matches.filter((m) => m.isPlayoff);
	const find = (slot: string) => games.find((m) => m.homeSlot?.toLowerCase() === slot || m.awaySlot?.toLowerCase() === slot);
	const seed = (slot: string | null) => (slot && /^\d(st|nd|rd|th)$/.test(slot) ? seeds[Number(slot[0]) - 1]! : null);
	const winner = (m?: Match) => {
		if (!m || m.homeScore === null || m.awayScore === null || m.homeScore === m.awayScore) return null;
		return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
	};

	for (const m of games) {
		m.homeTeamId ??= seed(m.homeSlot);
		m.awayTeamId ??= seed(m.awaySlot);
	}

	const qfWinners = games.filter((m) => seed(m.homeSlot) && seed(m.awaySlot)).map(winner);
	const [highest = null, lowest = null] = qfWinners.length === 2 && !qfWinners.includes(null) ? qfWinners.sort((a, b) => seeds.indexOf(a!) - seeds.indexOf(b!)) : [];
	const semi1 = find("lowest seed");
	const semi2 = find("highest seed");
	if (semi1) semi1.awayTeamId ??= lowest;
	if (semi2) semi2.awayTeamId ??= highest;

	const final = find("finals");
	if (final) {
		final.homeTeamId ??= winner(semi1);
		final.awayTeamId ??= winner(semi2);
	}
}

// Sunday women's: quarterfinals "1st".."8th". Their winners are re-ranked by seed: "1st winner" plays "4th winner", "2nd winner" plays "3rd winner",
// and the losers the same way ("1st loser"..). "Finals" is the winners of the two winners' semis, "Consolation" the winners of the two losers' semis.
export function resolveEightTeamPlayoffs(matches: Match[], seeds: number[]) {
	const games = matches.filter((m) => m.isPlayoff);
	const find = (slot: string) => games.find((m) => m.homeSlot?.toLowerCase() === slot);
	const seed = (slot: string | null) => (slot && /^\d(st|nd|rd|th)$/.test(slot) ? seeds[Number(slot[0]) - 1]! : null);
	// [winner, loser], or nothing until the game has a score that isn't a draw
	const result = (m?: Match) => (!m || m.homeScore === null || m.awayScore === null || m.homeScore === m.awayScore ? [null, null] : m.homeScore > m.awayScore ? [m.homeTeamId, m.awayTeamId] : [m.awayTeamId, m.homeTeamId]);
	const bySeed = (ids: (number | null)[]) => (ids.length === 4 && !ids.includes(null) ? ids.sort((a, b) => seeds.indexOf(a!) - seeds.indexOf(b!)) : []);

	for (const m of games) {
		m.homeTeamId ??= seed(m.homeSlot);
		m.awayTeamId ??= seed(m.awaySlot);
	}

	const quarterfinals = games.filter((m) => seed(m.homeSlot) && seed(m.awaySlot)).map(result);
	const winners = bySeed(quarterfinals.map(([w]) => w ?? null));
	const losers = bySeed(quarterfinals.map(([, l]) => l ?? null));
	const semiTeams = new Map(
		["1st", "2nd", "3rd", "4th"].flatMap((rank, i) => [
			[`${rank} winner`, winners[i]],
			[`${rank} loser`, losers[i]],
		]),
	);
	for (const m of games) {
		m.homeTeamId ??= semiTeams.get(m.homeSlot?.toLowerCase() ?? "") ?? null;
		m.awayTeamId ??= semiTeams.get(m.awaySlot?.toLowerCase() ?? "") ?? null;
	}

	for (const [game, semi1, semi2] of [
		["finals", "1st winner", "2nd winner"],
		["consolation", "1st loser", "2nd loser"],
	] as const) {
		const m = find(game);
		if (!m) continue;
		m.homeTeamId ??= result(find(semi1))[0] ?? null;
		m.awayTeamId ??= result(find(semi2))[0] ?? null;
	}
}
