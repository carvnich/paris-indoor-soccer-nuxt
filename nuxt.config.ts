import tailwindcss from "@tailwindcss/vite";

// Set in Cloudflare Workers Builds (and optionally .env) once the D1 database exists.
const cloudflareDatabaseId = process.env.NUXT_HUB_CLOUDFLARE_DATABASE_ID;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	// @nuxthub/core must load before @nuxtjs/better-auth
	modules: ["@nuxthub/core", "@nuxtjs/better-auth"],
	devtools: { enabled: true },
	css: ["~/assets/css/main.css"],
	compatibilityDate: "2026-09-23",

	vite: { plugins: [tailwindcss()] },

	nitro: { experimental: { tasks: true }, cloudflare: { wrangler: { name: "paris-indoor-soccer-nuxt", r2_buckets: [{ binding: "BLOB", bucket_name: "paris-indoor-soccer-nuxt-photos" }] } } },

	hub: {
		// Local dev: SQLite file in .data/db. Cloudflare build: D1 binding "DB".
		db: { dialect: "sqlite", casing: "snake_case", connection: cloudflareDatabaseId ? { databaseId: cloudflareDatabaseId } : undefined },
		// Local dev: files in .data/blob, or the real R2 bucket over its S3 API when S3_* keys are in .env. Cloudflare build: R2 binding "BLOB" (bucket set in nitro.cloudflare above).
		blob: true,
	},

	// With a Cloudflare API token in .env, `pnpm dev` uses the real D1 database (over Cloudflare's HTTP API) instead of .data/db
	$development: { hub: { db: { dialect: "sqlite", driver: process.env.NUXT_HUB_CLOUDFLARE_API_TOKEN ? "d1-http" : undefined } } },
	// NuxtHub would pick S3 whenever S3_* keys are set, baking them into a local build; production always uses the binding
	$production: { hub: { blob: { driver: "cloudflare-r2", binding: "BLOB" } } },
});
