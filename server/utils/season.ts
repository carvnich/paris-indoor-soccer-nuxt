// Pure functions (no auto-imports) so they can be run directly with node for testing.

interface Team {
	id: number;
	name: string;
	color: string;
}

interface Match {
	isPlayoff: boolean;
	homeTeamId: number | null;
	awayTeamId: number | null;
	homeSlot: string | null;
	awaySlot: string | null;
	homeScore: number | null;
	awayScore: number | null;
}

// Regular season only: 3 points a win, 1 a draw; ties broken by goal difference.
export function computeStandings(teams: Team[], matches: Match[]) {
	const rows = teams.map((t) => ({ ...t, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
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
			if (gf > ga) row.wins++;
			else if (gf < ga) row.losses++;
			else row.draws++;
			row.points = row.wins * 3 + row.draws;
		}
	}
	return rows.map((r) => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst })).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
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
