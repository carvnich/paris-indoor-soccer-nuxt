import { defineServerAuth } from "@nuxtjs/better-auth/config";
import { admin, username } from "better-auth/plugins";

export default defineServerAuth({
	emailAndPassword: {
		enabled: true,
		// Staff only for now; accounts are created with the db:create-user task.
		// Set to false to open player registration (new users get the "user" role).
		disableSignUp: true,
	},
	// Staff sign in with a username (e.g. "mike.bijman"). Roles: "admin" (everything) and "referee" (scores only).
	plugins: [admin(), username({ displayUsername: false })],
});
