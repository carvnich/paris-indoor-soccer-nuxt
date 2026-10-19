// Admin: delete one download (?pathname=downloads/<league>/<file>)
export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const pathname = String(getQuery(event).pathname);
	if (!pathname.startsWith("downloads/")) throw createError({ statusCode: 400, statusMessage: "Not a download" });
	await requireLeague(event, ["admin"], pathname.split("/")[1]!);
	await blob.del(pathname);
});
