// Admin: delete one download (?pathname=downloads/<league>/<file>)
export default defineEventHandler(async (event) => {
	await requireUserSession(event, { user: { role: "admin" } });
	const pathname = String(getQuery(event).pathname);
	if (!pathname.startsWith("downloads/")) throw createError({ statusCode: 400, statusMessage: "Not a download" });
	await blob.del(pathname);
});
