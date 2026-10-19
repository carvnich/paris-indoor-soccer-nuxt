import { defineServerAuth } from "@nuxtjs/better-auth/config";
import { admin, username } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

export default defineServerAuth({
	emailAndPassword: {
		enabled: true,
		// Staff only for now; accounts are created with the db:create-user task.
		// Set to false to open player registration (new users get the "user" role).
		disableSignUp: true,
	},
	// Staff sign in with a username (e.g. "mike.bijman"). Roles: "superadmin" (everything, every league), "admin" (scores, dates, downloads and players in their leagues) and "referee" (scores in their leagues).
	// The admin plugin exposes user management (set role, set password, list users) over /api/auth/admin/* to every role that has the permission. Only superadmin does; the others get the plain user permissions, which have none.
	plugins: [admin({ adminRoles: ["superadmin"], roles: { superadmin: adminAc, admin: userAc, referee: userAc, user: userAc } }), username({ displayUsername: false })],
	// League slugs a staff member may manage, comma-separated ("friday-coed,sunday-women"). Empty = none (superadmin ignores it). Set by the db:create-user task or in SQL, never by users.
	user: { additionalFields: { leagues: { type: "string", required: false, input: false } } },
});
