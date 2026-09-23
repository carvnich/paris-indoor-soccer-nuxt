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

	vite: {
		plugins: [tailwindcss()],
	},

	nitro: {
		experimental: { tasks: true },
		cloudflare: {
			wrangler: {
				name: "paris-indoor-soccer",
				r2_buckets: [{ binding: "BLOB", bucket_name: "paris-indoor-soccer-photos" }],
			},
		},
	},

	hub: {
		// Local dev: SQLite file in .data/db. Cloudflare build: D1 binding "DB".
		db: {
			dialect: "sqlite",
			casing: "snake_case",
			connection: cloudflareDatabaseId ? { databaseId: cloudflareDatabaseId } : undefined,
		},
		// Local dev: files in .data/blob. Cloudflare build: R2 binding "BLOB" (bucket set in nitro.cloudflare above).
		blob: true,
	},
});
