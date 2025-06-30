import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_PASSWORD,
});

const db = drizzle(client);

async function resetPlaylistTable() {
    try {        console.log("Dropping playlist and playlist_track tables...");
        await db.run(sql`DROP TABLE IF EXISTS playlist_track`);
        await db.run(sql`DROP TABLE IF EXISTS playlist`);
          console.log("Creating playlist and playlist_track tables with correct structure...");
        await db.run(sql`
            CREATE TABLE playlist (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
                UNIQUE(user_id, name)
            )
        `);
        
        await db.run(sql`
            CREATE TABLE playlist_track (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                playlist_id TEXT NOT NULL,
                info TEXT,
                FOREIGN KEY(playlist_id) REFERENCES playlist(id) ON DELETE CASCADE
            )
        `);
        
        console.log("Successfully reset playlist tables!");
    } catch (error) {
        console.error("Error resetting playlist table:", error);
    } finally {
        client.close();
    }
}

resetPlaylistTable();
