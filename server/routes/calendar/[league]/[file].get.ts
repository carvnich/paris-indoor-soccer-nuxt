// One team's games as an iCalendar feed that calendar apps subscribe to: /calendar/<league>/<color>.ics?season=2026-2027 (colors are unique per season and survive a re-seed, team ids don't).
// startsAt goes in as is with the league's timezone (DTSTART;TZID=…), so no Date conversion. Games are an hour long.
const timezone = [
	"BEGIN:VTIMEZONE",
	"TZID:America/Toronto",
	"BEGIN:DAYLIGHT",
	"TZOFFSETFROM:-0500",
	"TZOFFSETTO:-0400",
	"TZNAME:EDT",
	"DTSTART:19700308T020000",
	"RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
	"END:DAYLIGHT",
	"BEGIN:STANDARD",
	"TZOFFSETFROM:-0400",
	"TZOFFSETTO:-0500",
	"TZNAME:EST",
	"DTSTART:19701101T020000",
	"RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
	"END:STANDARD",
	"END:VTIMEZONE",
];
// iCalendar text escapes backslashes, semicolons and commas
const text = (s: string) => s.replace(/[\\;,]/g, "\\$&");

export default defineEventHandler(async (event) => {
	const color = getRouterParam(event, "file")!.replace(/\.ics$/, "");
	const { league, teams, matches } = await loadSeason(getRouterParam(event, "league"), getQuery(event).season);
	const team = teams.find((t) => t.color.toLowerCase() === color.toLowerCase());
	if (!team) throw createError({ statusCode: 404, statusMessage: "Team not found" });
	const name = (id: number | null, slot: string | null) => {
		const t = teams.find((t) => t.id === id);
		return t ? `${t.name} (${t.color})` : slot;
	};
	const stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, "");

	const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Paris Indoor Soccer//EN", `X-WR-CALNAME:${text(`${team.name} (${team.color}) - ${league.name}`)}`, "X-WR-TIMEZONE:America/Toronto", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H", ...timezone];
	for (const m of matches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id)) {
		lines.push(
			"BEGIN:VEVENT",
			`UID:match-${m.id}@parisindoorsoccer.ca`,
			`DTSTAMP:${stamp}`,
			`DTSTART;TZID=America/Toronto:${m.startsAt.replace(/[-:]/g, "")}`,
			"DURATION:PT1H",
			"LOCATION:51 William St\\, Paris ON N3L 1L2\\, Canada",
			`SUMMARY:${text(`${m.isPlayoff ? "Playoffs: " : ""}${name(m.homeTeamId, m.homeSlot)} vs ${name(m.awayTeamId, m.awaySlot)}`)}`,
		);
		if (m.homeScore !== null && m.awayScore !== null) lines.push(`DESCRIPTION:Final score ${m.homeScore} - ${m.awayScore}`);
		lines.push("END:VEVENT");
	}
	lines.push("END:VCALENDAR");

	setHeader(event, "content-type", "text/calendar; charset=utf-8");
	return lines.join("\r\n") + "\r\n";
});
