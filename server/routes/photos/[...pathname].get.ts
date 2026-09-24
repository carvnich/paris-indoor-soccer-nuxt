// Player photos from blob (R2 in production). Every upload gets a new key, so a URL's content never changes.
export default defineEventHandler(async (event) => {
	const photo = await blob.serve(event, getRouterParam(event, "pathname")!);
	setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
	return photo;
});
