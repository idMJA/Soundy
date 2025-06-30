import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database client
const client = createClient({
	url: process.env.DATABASE_URL ?? "file:local.db",
	authToken: process.env.DATABASE_PASSWORD,
});

const db = drizzle(client);

async function runMigration() {
	try {
		console.log("Starting migration to remove guildId from playlist table...");
		
		// Read the migration SQL
		const migrationSQL = readFileSync(
			join(__dirname, "remove-guild-id-migration.sql"),
			"utf-8"
		);
		
		// Split by semicolons and execute each statement
		const statements = migrationSQL
			.split(";")
			.map(stmt => stmt.trim())
			.filter(stmt => stmt.length > 0);
		
		for (const statement of statements) {
			console.log(`Executing: ${statement.substring(0, 50)}...`);
			await db.run(statement);
		}
		
		console.log("Migration completed successfully!");
		console.log("guildId column has been removed from the playlist table.");
		
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		await client.close();
	}
}

runMigration();
