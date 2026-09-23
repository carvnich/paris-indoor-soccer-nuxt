import { defineServerAuth } from "@nuxtjs/better-auth/config";
import { admin } from "better-auth/plugins";

export default defineServerAuth({
	emailAndPassword: {
		enabled: true,
		// Admin-only for now; accounts are created with the db:create-admin task.
		// Set to false to open player registration (new users get the "user" role).
		disableSignUp: true,
	},
	plugins: [admin()],
});
