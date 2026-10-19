import type { H3Event } from "h3";

type Staff = { role?: string | null; leagues?: string | null };

// Whether the user is a superadmin (every league) or has one of the roles and the league in their `leagues` list (empty = none)
export const canManage = (user: Staff | undefined, roles: ("admin" | "referee")[], league: string) => user?.role === "superadmin" || (!!user && roles.includes(user.role as "admin") && !!user.leagues?.split(",").includes(league));

// Signed-in staff who may manage the league: 401 signed out, 403 for another role or a league outside their list. Returns the user.
// The user is typed here because the module's inferred user type doesn't reach this file.
export async function requireLeague(event: H3Event, roles: ("admin" | "referee")[], league: string) {
	const { user } = (await requireUserSession(event)) as { user: Staff };
	if (!canManage(user, roles, league)) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
	return user;
}
