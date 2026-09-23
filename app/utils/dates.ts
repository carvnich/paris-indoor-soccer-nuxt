// startsAt is local wall-clock text with no offset. Formatting it as UTC shows the same wall-clock time on the server and in every browser.
const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

export const formatDate = (startsAt: string) => dateFormat.format(new Date(`${startsAt.slice(0, 10)}T12:00:00Z`));
export const formatTime = (startsAt: string) => timeFormat.format(new Date(`${startsAt}Z`));
// Today's date in the browser's timezone, as YYYY-MM-DD
export const today = () => new Date().toLocaleDateString("en-CA");

// Matches grouped by date, as [YYYY-MM-DD, matches] pairs in date order
export const groupByDay = <T extends { startsAt: string }>(matches: T[]) => Object.entries(Object.groupBy(matches, (m) => m.startsAt.slice(0, 10))) as [string, T[]][];
// Index of the next day to play, or the last day once the season is over
export const nextDayIndex = (days: [string, unknown][]) => {
	const i = days.findIndex(([day]) => day >= today());
	return i === -1 ? days.length - 1 : i;
};
