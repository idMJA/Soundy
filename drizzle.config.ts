import type { Config } from "drizzle-kit";
import { Environment } from "#soundy/config";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "turso",
	dbCredentials: {
		url:
			Environment.DatabaseUrl ?? "Hmm? Looks like the database URL is missing.",
		authToken: Environment.DatabasePassword,
	},
} satisfies Config;
