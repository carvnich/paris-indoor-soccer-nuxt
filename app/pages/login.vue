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
	<!-- No card: fields sit on the page with only a bottom border (transparent, square, no side padding); focus darkens the border instead of DaisyUI's outline box.
	     Floating labels: the placeholder rises into the label on focus. DaisyUI gives the label a base-100 background (to cover a top border) and the field's 0.75rem indent; inset-s-0 px-0 bg-transparent line it up with the unpadded text on the grey page. -->
	<form class="mx-auto mt-8 max-w-sm" @submit.prevent="submit">
		<fieldset class="flex flex-col gap-6">
			<h1 class="mb-12 text-3xl font-bold">Login</h1>
			<label class="floating-label">
				<input v-model="form.username" placeholder="Username" class="input input-lg w-full rounded-none border-x-0 border-t-0 bg-transparent px-0 focus:outline-none" autocomplete="username" autocapitalize="none" required />
				<span class="inset-s-0 bg-transparent px-0">Username</span>
			</label>
			<label class="floating-label">
				<input v-model="form.password" type="password" placeholder="Password" class="input input-lg w-full rounded-none border-x-0 border-t-0 bg-transparent px-0 focus:outline-none" autocomplete="current-password" required />
				<span class="inset-s-0 bg-transparent px-0">Password</span>
			</label>
			<p v-if="error" class="text-error">{{ error.message }}</p>
			<button class="btn mt-2 btn-neutral btn-lg" :disabled="status === 'pending'">Sign in</button>
		</fieldset>
	</form>
</template>
