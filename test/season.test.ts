import assert from "node:assert/strict";
import { test } from "node:test";
import legacy from "../server/db/seed/matches-2024-2025.json" with { type: "json" };
import sunday from "../server/db/seed/sunday-women-2026-2027.json" with { type: "json" };
import { capScore, computeStandings, resolveEightTeamPlayoffs, resolvePlayoffs } from "../server/utils/season.ts";

// The real 2024/25 season (final scores, real playoff teams) as database rows
const teams = [...new Map(legacy.map((m) => [m.homeTeam.color, m.homeTeam.team])).entries()].map(([color, name], i) => ({ id: i + 1, seasonId: 1, name, color }));
const teamId = (color: string) => teams.find((t) => t.color === color)!.id;
const season = () =>
	legacy.map((m, i) => ({ id: i + 1, code: m.matchId, seasonId: 1, startsAt: m.dateTime, homeTeamId: teamId(m.homeTeam.color), awayTeamId: teamId(m.awayTeam.color), homeSlot: null, awaySlot: null, homeScore: m.homeTeam.score ?? null, awayScore: m.awayTeam.score ?? null, isPlayoff: m.isPlayoff }));
const bracket = (matches: ReturnType<typeof season>) => matches.filter((m) => m.isPlayoff).map((m) => `${teams.find((t) => t.id === m.homeTeamId)?.name} v ${teams.find((t) => t.id === m.awayTeamId)?.name}`);

// Clears the playoff teams and uses the placeholder labels from the 2025/26 schedule, then resolves them
function resolve(matches: ReturnType<typeof season>, unplayed: number[] = []) {
	const slots = ["3rd v 6th", "4th v 5th", "1st v Lowest Seed", "2nd v Highest seed", "Finals v Finals"].map((s) => s.split(" v "));
	const seeds = computeStandings(teams, matches).map((t) => t.id);
	matches.filter((m) => m.isPlayoff).forEach((m, i) => Object.assign(m, { homeTeamId: null, awayTeamId: null, homeSlot: slots[i]![0], awaySlot: slots[i]![1] }, unplayed.includes(i) && { homeScore: null, awayScore: null }));
	resolvePlayoffs(matches, seeds);
	return bracket(matches);
}

test("standings match the 2024/25 final table", () => {
	assert.deepEqual(
		computeStandings(teams, season()).map((t) => `${t.name} ${t.points}`),
		["Josh 52", "Nick 42", "Adam 38", "Kurtis 26", "Patrick 10", "Ted 5"],
	);
});

test("placeholders resolve to the real 2024/25 bracket", () => {
	assert.deepEqual(resolve(season()), bracket(season()));
});

test("semifinal opponents wait for both quarterfinals", () => {
	assert.deepEqual(resolve(season(), [0, 2, 3, 4]), ["Adam v Ted", "Kurtis v Patrick", "Josh v undefined", "Nick v undefined", "undefined v undefined"]);
});

// Sunday women's 2026/27 playoffs, with team ids = seeds (1st = 1). Quarterfinal scores [home, away] in schedule order (1v8, 4v5, 3v6, 2v7), then the semis (W1, W2, L1, L2).
function sundayPlayoffs(scores: [number, number][]) {
	const matches = sunday
		.filter((m) => m.isPlayoff)
		.map((m, i) => ({ id: i + 1, code: m.matchId, seasonId: 1, startsAt: m.dateTime, homeTeamId: null, awayTeamId: null, homeSlot: m.homeTeam.team, awaySlot: m.awayTeam.team, homeScore: scores[i]?.[0] ?? null, awayScore: scores[i]?.[1] ?? null, isPlayoff: true }));
	resolveEightTeamPlayoffs(matches, [1, 2, 3, 4, 5, 6, 7, 8]);
	return matches.map((m) => `${m.homeTeamId} v ${m.awayTeamId}`);
}

test("eight-team playoffs re-rank quarterfinal winners and losers by seed", () => {
	// 8th upsets 1st: winners 2, 3, 4, 8 and losers 1, 5, 6, 7. Then 8, 3, 1 and 6 win their semis.
	assert.deepEqual(
		sundayPlayoffs([
			[0, 1],
			[2, 1],
			[3, 0],
			[1, 0],
			[2, 3],
			[1, 0],
			[2, 0],
			[0, 4],
		]),
		["1 v 8", "4 v 5", "3 v 6", "2 v 7", "2 v 8", "3 v 4", "1 v 7", "5 v 6", "8 v 3", "1 v 6"],
	);
});

test("eight-team semis wait for every quarterfinal", () => {
	assert.deepEqual(
		sundayPlayoffs([
			[0, 1],
			[2, 1],
			[3, 0],
		]),
		["1 v 8", "4 v 5", "3 v 6", "2 v 7", "null v null", "null v null", "null v null", "null v null", "null v null", "null v null"],
	);
});

test("a goal margin cap cuts the winner's goals, and the real goal difference still breaks ties on points", () => {
	assert.deepEqual(capScore(9, 1, 5), [6, 1]);
	assert.deepEqual(capScore(0, 7, 5), [0, 5]);
	assert.deepEqual(capScore(6, 1, 5), [6, 1]);
	assert.deepEqual(capScore(9, 1, null), [9, 1]);
	// Each team wins once and loses once (3 points each): A beats C 9-0, B beats A 4-0, C beats B 3-0
	const [a, b, c] = [1, 2, 3].map((id) => ({ id, seasonId: 1, name: String(id), color: String(id) }));
	const game = (id: number, home: number, away: number, homeScore: number, awayScore: number) => ({ id, code: String(id), seasonId: 1, startsAt: "2026-10-16T19:30:00", homeTeamId: home, awayTeamId: away, homeSlot: null, awaySlot: null, homeScore, awayScore, isPlayoff: false });
	const matches = [game(1, 1, 3, 9, 0), game(2, 2, 1, 4, 0), game(3, 3, 2, 3, 0)];
	// Capped, A and B are level on +1; the real goal difference (A +5, B +1) puts A first even though B is listed first
	assert.deepEqual(
		computeStandings([b!, a!, c!], matches, 5).map((t) => [t.id, t.points, t.goalDifference, t.goalsFor]),
		[
			[1, 3, 1, 5],
			[2, 3, 1, 4],
			[3, 3, -2, 3],
		],
	);
});
