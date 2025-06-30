import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// =========================================
// Guild Settings & Configuration
// =========================================

// Guild settings and configuration
export const guild = sqliteTable("guild", {
	id: text("id").primaryKey(),
	// Locale settings
	locale: text("locale"),
	// Prefix settings
	prefix: text("prefix"),
	// Player settings
	defaultVolume: integer("default_volume"),
	// 24/7 mode settings
	enabled247: integer("enabled_247", { mode: "boolean" })
		.notNull()
		.default(false),
	channel247Id: text("channel_247_id"),
	text247Id: text("text_247_id"),
	// Setup settings
	setupChannelId: text("setup_channel_id"),
	setupTextId: text("setup_text_id"),
	// Voice status
	voiceStatus: integer("voice_status", { mode: "boolean" })
		.notNull()
		.default(true),
	// Timestamps
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// =========================================
// Playlist Related Tables
// =========================================

export const playlist = sqliteTable("playlist", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const playlistTrack = sqliteTable("playlist_track", {
	id: text("id").primaryKey(),
	url: text("url").notNull(),
	playlistId: text("playlist_id")
		.notNull()
		.references(() => playlist.id, { onDelete: "cascade" }),
	info: text("info"), // menyimpan info lagu dalam bentuk JSON
});

// =========================================
// Statistics Tables
// =========================================

export const trackStats = sqliteTable("track_stats", {
	id: text("id").primaryKey(),
	trackId: text("track_id").notNull(),
	title: text("title").notNull(),
	author: text("author").notNull(),
	playCount: integer("play_count").notNull().default(1),
	guildId: text("guild_id").notNull(),
	lastPlayed: text("last_played").default(sql`CURRENT_TIMESTAMP`),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userStats = sqliteTable("user_stats", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	guildId: text("guild_id").notNull(),
	playCount: integer("play_count").notNull().default(1),
	lastPlayed: text("last_played").default(sql`CURRENT_TIMESTAMP`),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// =========================================
// User Vote & Premium
// =========================================

export const userVote = sqliteTable("user_vote", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	votedAt: text("voted_at").default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text("expires_at").notNull(),
	type: text("type").notNull().default("vote"),
});
