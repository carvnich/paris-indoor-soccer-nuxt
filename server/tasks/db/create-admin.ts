// Public sign-up is disabled, so admin accounts are created here.
export default defineTask({
	meta: { name: "db:create-admin", description: "Create an admin account. Payload: { name, email, password }" },
	async run({ payload }) {
		const { name, email, password } = payload as { name: string; email: string; password: string };
		const { user } = await serverAuth().api.createUser({ body: { name, email, password, role: "admin" } });
		return { result: { id: user.id, email: user.email } };
	},
});
