// League files from blob (R2 in production), at /downloads/<league>/<file>. No long cache: a re-upload keeps the same name. blob.serve decodes the pathname itself.
export default defineEventHandler((event) => blob.serve(event, `downloads/${getRouterParam(event, "pathname")}`));
