import tailwindcss from "@tailwindcss/vite";

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
		db: { dialect: "sqlite", casing: "snake_case" },
		// Local dev: files in .data/blob, or the real R2 bucket over its S3 API when S3_* keys are in .env. Cloudflare build: R2 binding "BLOB" (bucket set in nitro.cloudflare above).
		blob: true,
	},

	// With a Cloudflare API token in .env, `pnpm dev` uses the real D1 database (over Cloudflare's HTTP API) instead of .data/db
	$development: { hub: { db: { dialect: "sqlite", driver: process.env.NUXT_HUB_CLOUDFLARE_API_TOKEN ? "d1-http" : undefined } } },
	// D1 database "paris-indoor-soccer-nuxt" (dev over d1-http reads the id from .env). NuxtHub would pick S3 whenever S3_* keys are set, baking them into a local build; production always uses the binding
	$production: { hub: { db: { dialect: "sqlite", connection: { databaseId: "1d55e784-eeac-46ca-8988-197983ccc9fa" } }, blob: { driver: "cloudflare-r2", binding: "BLOB" } } },
});
