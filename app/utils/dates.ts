// startsAt is local wall-clock text with no offset. Formatting it as UTC shows the same wall-clock time on the server and in every browser.
const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

export const formatDate = (startsAt: string) => dateFormat.format(new Date(`${startsAt.slice(0, 10)}T12:00:00Z`));
export const formatTime = (startsAt: string) => timeFormat.format(new Date(`${startsAt}Z`));
// Today's date in the league's timezone, as YYYY-MM-DD. Fixed so the server (UTC on Workers) and the browser agree on the day.
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

// Matches grouped by date, as [YYYY-MM-DD, matches] pairs in date order
export const groupByDay = <T extends { startsAt: string }>(matches: T[]) => Object.entries(Object.groupBy(matches, (m) => m.startsAt.slice(0, 10))) as [string, T[]][];
// Index of the match day closest to now: the distance is from now to the day's first game, so Saturday and Sunday still show Friday's games and Wednesday on shows the next Friday. A tie goes to the upcoming day.
export const nextDayIndex = (days: [string, { startsAt: string }[]][]) => {
	const now = Date.parse(`${new Date().toLocaleString("sv-SE", { timeZone: "America/Toronto" }).replace(" ", "T")}Z`);
	let best = 0;
	let bestDistance = Infinity;
	days.forEach(([, matches], i) => {
		const start = Date.parse(`${matches[0]!.startsAt}Z`);
		const distance = Math.abs(start - now);
		if (distance < bestDistance || (distance === bestDistance && start > now)) [best, bestDistance] = [i, distance];
	});
	return best;
};
