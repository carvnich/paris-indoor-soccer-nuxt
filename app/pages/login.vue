<script setup lang="ts">
// Signed-in users are sent home
definePageMeta({ auth: "guest" });

const route = useRoute();
const { execute, status, error } = useSignIn("email");
const form = reactive({ email: "", password: "" });

async function submit() {
	await execute(form);
	if (status.value === "success") await navigateTo(String(route.query.redirect ?? "/"));
}
</script>

<template>
	<form class="card mx-auto max-w-sm bg-base-200" @submit.prevent="submit">
		<fieldset class="card-body">
			<h1 class="card-title">Admin login</h1>
			<label class="label" for="email">Email</label>
			<input id="email" v-model="form.email" type="email" class="input w-full" autocomplete="username" required />
			<label class="label" for="password">Password</label>
			<input id="password" v-model="form.password" type="password" class="input w-full" autocomplete="current-password" required />
			<p v-if="error" class="text-error">{{ error.message }}</p>
			<button class="btn btn-primary mt-2" :disabled="status === 'pending'">Sign in</button>
		</fieldset>
	</form>
</template>
