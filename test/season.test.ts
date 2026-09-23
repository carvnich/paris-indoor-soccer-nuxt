import assert from "node:assert/strict";
import { test } from "node:test";
import legacy from "../server/db/seed/matches-2024-2025.json" with { type: "json" };
import { computeStandings, resolvePlayoffs } from "../server/utils/season.ts";

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
