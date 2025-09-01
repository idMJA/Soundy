import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/local",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "./data/soundy-bun.db",
	},
});
