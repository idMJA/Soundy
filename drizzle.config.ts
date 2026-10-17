import type { Config } from "drizzle-kit";
import { Environment } from "#soundy/config";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "turso",
	tablesFilter: ["!turso_*"],
	dbCredentials: {
		url:
			Environment?.DatabaseUrl ??
			process.env.DATABASE_URL ??
			"Hmm? Looks like the database URL is missing.",
		authToken: Environment?.DatabasePassword ?? process.env.DATABASE_PASSWORD,
	},
} satisfies Config;
