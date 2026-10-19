// Public sign-up is disabled, so staff accounts are created here. They sign in with the username; nobody uses the email,
// but Better Auth requires one, so it's a placeholder on the reserved .invalid domain. The role goes in `data` because
// createUser's `role` type only lists the built-in roles ("referee" works at runtime).
export default defineTask({
	meta: { name: "db:create-user", description: 'Create a staff account. Payload: { name, username, password, role: "superadmin" | "admin" | "referee", leagues?: "friday-coed,sunday-women" } (admins and referees reach only their leagues; superadmin reaches all)' },
	async run({ payload }) {
		const { name, username, password, role, leagues } = payload as { name: string; username: string; password: string; role: "superadmin" | "admin" | "referee"; leagues?: string };
		if (role !== "superadmin" && role !== "admin" && role !== "referee") throw new Error('role must be "superadmin", "admin" or "referee"');
		const { user } = await serverAuth().api.createUser({ body: { name, email: `${username}@paris-indoor-soccer.invalid`, password, data: { username, role, leagues } } });
		return { result: { id: user.id, username, role: user.role, leagues } };
	},
});
