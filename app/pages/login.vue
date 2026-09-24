<script setup lang="ts">
// Signed-in users are sent home
definePageMeta({ auth: "guest" });

const route = useRoute();
const { execute, status, error } = useSignIn("username");
const form = reactive({ username: "", password: "" });

async function submit() {
	await execute(form);
	if (status.value === "success") await navigateTo(String(route.query.redirect ?? "/"));
}
</script>

<template>
	<form class="card mx-auto mt-8 max-w-sm bg-base-100 shadow-xl" @submit.prevent="submit">
		<fieldset class="card-body">
			<h1 class="mb-2 text-3xl font-bold">Staff login</h1>
			<label class="label" for="username">Username</label>
			<input id="username" v-model="form.username" class="input w-full" autocomplete="username" autocapitalize="none" required />
			<label class="label" for="password">Password</label>
			<input id="password" v-model="form.password" type="password" class="input w-full" autocomplete="current-password" required />
			<p v-if="error" class="text-error">{{ error.message }}</p>
			<button class="btn btn-primary mt-2" :disabled="status === 'pending'">Sign in</button>
		</fieldset>
	</form>
</template>
