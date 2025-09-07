import { Database } from "bun:sqlite";
import { Logger } from "seyfert";
import { mkdir } from "node:fs/promises";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { drizzle as drizzleBun } from "drizzle-orm/bun-sqlite";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { Environment } from "#soundy/config";

const logger = new Logger({
	name: "[Database]",
});

/**
 * Bun Database Manager
 * Uses Bun SQLite as primary database with Turso as fallback
 * Provides ultra-fast local operations with remote backup capability
 */
export class BunDatabase {
	private bunDb!: ReturnType<typeof drizzleBun>;
	private tursoDb!: ReturnType<typeof drizzleLibsql>;
	private bunClient!: Database;
	private isInitialized = false;

	constructor() {
		this.initializeDatabases();
	}

	/**
	 * Ensure data directory exists
	 */
	private async ensureDataDirectory(): Promise<void> {
		try {
			await mkdir("./data", { recursive: true });
			logger.info("[Database] Data directory ensured");
		} catch (error) {
			logger.error("[Database] Failed to create data directory:", error);
			throw error;
		}
	}

	/**
	 * Initialize both Bun and Turso database connections
	 */
	private async initializeDatabases(): Promise<void> {
		try {
			await this.ensureDataDirectory();

			this.bunClient = new Database("./data/soundy-bun.db");
			this.bunDb = drizzleBun(this.bunClient, { schema });

			const tursoClient = createClient({
				url:
					Environment.DatabaseUrl ??
					"Hmm? Looks like the database URL is missing.",
				authToken: Environment.DatabasePassword,
			});
			this.tursoDb = drizzleLibsql(tursoClient, { schema });

			await this.initializeBunSchema();
			this.isInitialized = true;
			logger.info("[Database] Bun Database initialized successfully");
		} catch (error) {
			logger.error("[Database] Failed to initialize databases:", error);
			throw error;
		}
	}

	/**
	 * Initialize Bun SQLite schema manually
	 */
	private async initializeBunSchema(): Promise<void> {
		try {
			const createQueries = [
				`CREATE TABLE IF NOT EXISTS guild (
					id TEXT PRIMARY KEY,
					locale TEXT,
					prefix TEXT,
					default_volume INTEGER,
					enabled_247 INTEGER NOT NULL DEFAULT 0,
					channel_247_id TEXT,
					text_247_id TEXT,
					setup_channel_id TEXT,
					setup_text_id TEXT,
					voice_status INTEGER NOT NULL DEFAULT 1,
					created_at TEXT DEFAULT CURRENT_TIMESTAMP,
					updated_at TEXT DEFAULT CURRENT_TIMESTAMP
				)`,

				`CREATE TABLE IF NOT EXISTS liked_songs (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					track_id TEXT NOT NULL,
					title TEXT NOT NULL,
					author TEXT NOT NULL,
					uri TEXT NOT NULL,
					artwork TEXT,
					length INTEGER,
					is_stream INTEGER DEFAULT 0,
					liked_at TEXT DEFAULT CURRENT_TIMESTAMP
				)`,

				`CREATE TABLE IF NOT EXISTS playlist (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					name TEXT NOT NULL,
					created_at TEXT DEFAULT CURRENT_TIMESTAMP
				)`,

				`CREATE TABLE IF NOT EXISTS playlist_track (
					id TEXT PRIMARY KEY,
					url TEXT NOT NULL,
					playlist_id TEXT NOT NULL,
					info TEXT,
					FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE
				)`,

				`CREATE TABLE IF NOT EXISTS track_stats (
					id TEXT PRIMARY KEY,
					track_id TEXT NOT NULL,
					title TEXT NOT NULL,
					author TEXT NOT NULL,
					uri TEXT NOT NULL,
					artwork TEXT,
					length INTEGER,
					is_stream INTEGER DEFAULT 0,
					user_id TEXT NOT NULL,
					play_count INTEGER NOT NULL DEFAULT 1,
					guild_id TEXT NOT NULL,
					last_played TEXT DEFAULT CURRENT_TIMESTAMP,
					created_at TEXT DEFAULT CURRENT_TIMESTAMP
				)`,

				`CREATE TABLE IF NOT EXISTS user_stats (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					guild_id TEXT NOT NULL,
					play_count INTEGER NOT NULL DEFAULT 1,
					last_played TEXT DEFAULT CURRENT_TIMESTAMP,
					created_at TEXT DEFAULT CURRENT_TIMESTAMP
				)`,

				`CREATE TABLE IF NOT EXISTS user_vote (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					voted_at TEXT DEFAULT CURRENT_TIMESTAMP,
					expires_at TEXT NOT NULL,
					type TEXT NOT NULL DEFAULT 'vote'
				)`,
			];

			for (const query of createQueries) {
				this.bunClient.run(query);
			}

			logger.info("[Database] Bun schema initialized successfully");
		} catch (error) {
			logger.warn(
				"[Database] Schema initialization failed, database may already be up to date:",
				error,
			);
		}
	}

	/**
	 * Execute operation with Bun first, fallback to Turso
	 */
	private async executeWithFallback<T>(
		bunOperation: () => Promise<T> | T,
		tursoOperation: () => Promise<T> | T,
		operationName: string,
	): Promise<T> {
		try {
			const result = await bunOperation();
			return result;
		} catch (bunError) {
			logger.warn(
				`Bun operation failed for ${operationName}, falling back to Turso:`,
				bunError,
			);

			try {
				const result = await tursoOperation();
				logger.info(`Turso fallback successful for ${operationName}`);
				return result;
			} catch (tursoError) {
				logger.error(`Both Bun and Turso failed for ${operationName}:`, {
					bunError,
					tursoError,
				});
				throw new Error(
					`Database operation failed: ${operationName}. Bun: ${bunError}. Turso: ${tursoError}`,
				);
			}
		}
	}

	/**
	 * Execute write operation with background Turso sync
	 */
	private async executeWriteWithSync<T>(
		bunOperation: () => Promise<T> | T,
		tursoOperation: () => Promise<T> | T,
		operationName: string,
	): Promise<T> {
		const result = await this.executeWithFallback(
			bunOperation,
			tursoOperation,
			operationName,
		);

		setTimeout(async () => {
			try {
				await tursoOperation();
			} catch (error) {
				logger.warn(
					`Background sync to Turso failed for ${operationName}:`,
					error,
				);
			}
		}, 0);

		return result;
	}

	/**
	 * Get guild locale with Bun-first approach
	 */
	public async getLocale(guildId: string): Promise<string> {
		return this.executeWithFallback(
			() =>
				this.bunDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			() =>
				this.tursoDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			`getLocale(${guildId})`,
		).then((data) => data?.locale || "en-US");
	}

	/**
	 * Set guild locale with Bun-first approach
	 */
	public async setLocale(guildId: string, locale: string): Promise<void> {
		const values = {
			id: guildId,
			locale,
			updatedAt: new Date().toISOString(),
		};

		return this.executeWriteWithSync(
			async () => {
				await this.bunDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: { locale, updatedAt: values.updatedAt },
					});
			},
			async () => {
				await this.tursoDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: { locale, updatedAt: values.updatedAt },
					});
			},
			`setLocale(${guildId}, ${locale})`,
		);
	}

	/**
	 * Get guild player settings with Bun-first approach
	 */
	public async getPlayer(guildId: string): Promise<{ defaultVolume: number }> {
		return this.executeWithFallback(
			() =>
				this.bunDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			() =>
				this.tursoDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			`getPlayer(${guildId})`,
		).then((data) => ({ defaultVolume: data?.defaultVolume || 100 }));
	}

	/**
	 * Get premium status with Bun-first approach
	 */
	public async getPremiumStatus(
		userId: string,
	): Promise<{ type: string; timeRemaining: number } | null> {
		const now = new Date().toISOString();

		return this.executeWithFallback(
			async () => {
				let vote = this.bunDb
					.select()
					.from(schema.userVote)
					.where(
						and(
							eq(schema.userVote.userId, userId),
							eq(schema.userVote.type, "regular"),
							gt(schema.userVote.expiresAt, now),
						),
					)
					.orderBy(desc(schema.userVote.expiresAt))
					.get();

				if (!vote) {
					vote = this.bunDb
						.select()
						.from(schema.userVote)
						.where(
							and(
								eq(schema.userVote.userId, userId),
								eq(schema.userVote.type, "vote"),
								gt(schema.userVote.expiresAt, now),
							),
						)
						.orderBy(desc(schema.userVote.expiresAt))
						.get();
				}

				return vote;
			},
			async () => {
				let vote = await this.tursoDb
					.select()
					.from(schema.userVote)
					.where(
						and(
							eq(schema.userVote.userId, userId),
							eq(schema.userVote.type, "regular"),
							gt(schema.userVote.expiresAt, now),
						),
					)
					.orderBy(desc(schema.userVote.expiresAt))
					.get();

				if (!vote) {
					vote = await this.tursoDb
						.select()
						.from(schema.userVote)
						.where(
							and(
								eq(schema.userVote.userId, userId),
								eq(schema.userVote.type, "vote"),
								gt(schema.userVote.expiresAt, now),
							),
						)
						.orderBy(desc(schema.userVote.expiresAt))
						.get();
				}

				return vote;
			},
			`getPremiumStatus(${userId})`,
		).then((vote) => {
			if (!vote) return null;
			return {
				type: vote.type,
				timeRemaining: new Date(vote.expiresAt).getTime() - Date.now(),
			};
		});
	}

	/**
	 * Add user vote with Bun-first approach
	 */
	public async addUserVote(userId: string): Promise<void> {
		const TWELVE_HOURS = 12 * 60 * 60 * 1000;
		const expiresAt = new Date(Date.now() + TWELVE_HOURS).toISOString();
		const now = new Date().toISOString();
		const id = crypto.randomUUID();

		const values = {
			id,
			userId,
			expiresAt,
			type: "vote" as const,
			votedAt: now,
		};

		return this.executeWriteWithSync(
			async () => {
				const existingVote = this.bunDb
					.select()
					.from(schema.userVote)
					.where(
						and(
							eq(schema.userVote.userId, userId),
							eq(schema.userVote.type, "vote"),
							gt(schema.userVote.expiresAt, now),
						),
					)
					.get();

				if (existingVote) {
					await this.bunDb
						.update(schema.userVote)
						.set({ expiresAt, votedAt: now })
						.where(eq(schema.userVote.id, existingVote.id));
				} else {
					await this.bunDb.insert(schema.userVote).values(values);
				}
			},
			async () => {
				const existingVote = await this.tursoDb
					.select()
					.from(schema.userVote)
					.where(
						and(
							eq(schema.userVote.userId, userId),
							eq(schema.userVote.type, "vote"),
							gt(schema.userVote.expiresAt, now),
						),
					)
					.get();

				if (existingVote) {
					await this.tursoDb
						.update(schema.userVote)
						.set({ expiresAt, votedAt: now })
						.where(eq(schema.userVote.id, existingVote.id));
				} else {
					await this.tursoDb.insert(schema.userVote).values(values);
				}
			},
			`addUserVote(${userId})`,
		);
	}

	/**
	 * Get guild prefix with Bun-first approach
	 */
	public async getPrefix(guildId: string): Promise<string> {
		return this.executeWithFallback(
			() =>
				this.bunDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			() =>
				this.tursoDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			`getPrefix(${guildId})`,
		).then((data) => data?.prefix || "s!");
	}

	/**
	 * Set guild prefix with Bun-first approach
	 */
	public async setPrefix(guildId: string, prefix: string): Promise<void> {
		const values = {
			id: guildId,
			prefix,
			updatedAt: new Date().toISOString(),
		};

		return this.executeWriteWithSync(
			async () => {
				await this.bunDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: { prefix, updatedAt: values.updatedAt },
					});
			},
			async () => {
				await this.tursoDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: { prefix, updatedAt: values.updatedAt },
					});
			},
			`setPrefix(${guildId}, ${prefix})`,
		);
	}

	/**
	 * Delete guild prefix with Bun-first approach
	 */
	public async deletePrefix(guildId: string): Promise<void> {
		const values = {
			prefix: null,
			updatedAt: new Date().toISOString(),
		};

		return this.executeWriteWithSync(
			async () => {
				await this.bunDb
					.update(schema.guild)
					.set(values)
					.where(eq(schema.guild.id, guildId));
			},
			async () => {
				await this.tursoDb
					.update(schema.guild)
					.set(values)
					.where(eq(schema.guild.id, guildId));
			},
			`deletePrefix(${guildId})`,
		);
	}

	/**
	 * Get setup data for a guild with Bun-first approach
	 */
	public async getSetup(guildId: string): Promise<{
		id: string;
		guildId: string;
		channelId: string;
		messageId: string;
		createdAt: Date;
	} | null> {
		return this.executeWithFallback(
			() =>
				this.bunDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			() =>
				this.tursoDb
					.select()
					.from(schema.guild)
					.where(eq(schema.guild.id, guildId))
					.get(),
			`getSetup(${guildId})`,
		).then((data) =>
			data?.setupChannelId && data?.setupTextId
				? {
						id: data.id,
						guildId: data.id,
						channelId: data.setupChannelId,
						messageId: data.setupTextId,
						createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
					}
				: null,
		);
	}

	/**
	 * Create setup for a guild with Bun-first approach
	 */
	public async createSetup(
		guildId: string,
		channelId: string,
		messageId: string,
	): Promise<void> {
		const values = {
			id: guildId,
			setupChannelId: channelId,
			setupTextId: messageId,
			updatedAt: new Date().toISOString(),
		};

		return this.executeWriteWithSync(
			async () => {
				await this.bunDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: {
							setupChannelId: channelId,
							setupTextId: messageId,
							updatedAt: values.updatedAt,
						},
					});
			},
			async () => {
				await this.tursoDb
					.insert(schema.guild)
					.values(values)
					.onConflictDoUpdate({
						target: schema.guild.id,
						set: {
							setupChannelId: channelId,
							setupTextId: messageId,
							updatedAt: values.updatedAt,
						},
					});
			},
			`createSetup(${guildId}, ${channelId}, ${messageId})`,
		);
	}

	/**
	 * Delete setup for a guild with Bun-first approach
	 */
	public async deleteSetup(guildId: string): Promise<void> {
		const values = {
			setupChannelId: null,
			setupTextId: null,
			updatedAt: new Date().toISOString(),
		};

		return this.executeWriteWithSync(
			async () => {
				await this.bunDb
					.update(schema.guild)
					.set(values)
					.where(eq(schema.guild.id, guildId));
			},
			async () => {
				await this.tursoDb
					.update(schema.guild)
					.set(values)
					.where(eq(schema.guild.id, guildId));
			},
			`deleteSetup(${guildId})`,
		);
	}

	/**
	 * Get liked songs with Bun-first approach
	 */
	public async getLikedSongs(
		userId: string,
		limit: number = 50,
	): Promise<
		Array<{
			id: string;
			trackId: string;
			title: string;
			author: string;
			uri: string;
			artwork: string | null;
			length: number | null;
			isStream: boolean;
			likedAt: string;
		}>
	> {
		return this.executeWithFallback(
			() =>
				this.bunDb
					.select()
					.from(schema.likedSongs)
					.where(eq(schema.likedSongs.userId, userId))
					.orderBy(desc(schema.likedSongs.likedAt))
					.limit(limit),
			() =>
				this.tursoDb
					.select()
					.from(schema.likedSongs)
					.where(eq(schema.likedSongs.userId, userId))
					.orderBy(desc(schema.likedSongs.likedAt))
					.limit(limit),
			`getLikedSongs(${userId})`,
		).then((songs) =>
			songs.map((song) => ({
				id: song.id,
				trackId: song.trackId,
				title: song.title,
				author: song.author,
				uri: song.uri,
				artwork: song.artwork,
				length: song.length,
				isStream: !!song.isStream,
				likedAt: song.likedAt ?? new Date().toISOString(),
			})),
		);
	}

	/**
	 * Add to liked songs with Bun-first approach
	 */
	public async addToLikedSongs(
		userId: string,
		trackId: string,
		title: string,
		author: string,
		uri: string,
		artwork?: string,
		length?: number,
		isStream?: boolean,
	): Promise<boolean> {
		const id = crypto.randomUUID();
		const values = {
			id,
			userId,
			trackId,
			title,
			author,
			uri,
			artwork: artwork || null,
			length: length || null,
			isStream: isStream || false,
			likedAt: new Date().toISOString(),
		};

		try {
			await this.executeWriteWithSync(
				async () => {
					const existing = this.bunDb
						.select()
						.from(schema.likedSongs)
						.where(
							and(
								eq(schema.likedSongs.userId, userId),
								eq(schema.likedSongs.trackId, trackId),
							),
						)
						.get();

					if (existing) throw new Error("Already exists");
					await this.bunDb.insert(schema.likedSongs).values(values);
				},
				async () => {
					const existing = await this.tursoDb
						.select()
						.from(schema.likedSongs)
						.where(
							and(
								eq(schema.likedSongs.userId, userId),
								eq(schema.likedSongs.trackId, trackId),
							),
						)
						.get();

					if (existing) throw new Error("Already exists");
					await this.tursoDb.insert(schema.likedSongs).values(values);
				},
				`addToLikedSongs(${userId}, ${trackId})`,
			);
			return true;
		} catch (error) {
			if (error instanceof Error && error.message.includes("Already exists")) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Get playlists with Bun-first approach
	 */
	public async getPlaylists(userId: string) {
		return this.executeWithFallback(
			async () => {
				const playlists = this.bunDb
					.select()
					.from(schema.playlist)
					.where(eq(schema.playlist.userId, userId))
					.all();

				return Promise.all(
					playlists.map(async (playlist) => {
						const tracks = this.bunDb
							.select()
							.from(schema.playlistTrack)
							.where(eq(schema.playlistTrack.playlistId, playlist.id))
							.all();
						return { ...playlist, tracks };
					}),
				);
			},
			async () => {
				const playlists = await this.tursoDb
					.select()
					.from(schema.playlist)
					.where(eq(schema.playlist.userId, userId))
					.all();

				return Promise.all(
					playlists.map(async (playlist) => {
						const tracks = await this.tursoDb
							.select()
							.from(schema.playlistTrack)
							.where(eq(schema.playlistTrack.playlistId, playlist.id))
							.all();
						return { ...playlist, tracks };
					}),
				);
			},
			`getPlaylists(${userId})`,
		);
	}

	/**
	 * Create playlist with Bun-first approach
	 */
	public async createPlaylist(userId: string, name: string): Promise<boolean> {
		const id = crypto.randomUUID();
		const values = {
			id,
			userId,
			name,
			createdAt: new Date().toISOString(),
		};

		try {
			await this.executeWriteWithSync(
				async () => {
					await this.bunDb.insert(schema.playlist).values(values);
				},
				async () => {
					await this.tursoDb.insert(schema.playlist).values(values);
				},
				`createPlaylist(${userId}, ${name})`,
			);
			return true;
		} catch (error) {
			logger.error("Failed to create playlist:", error);
			return false;
		}
	}

	/**
	 * Get top tracks with Bun-first approach
	 */
	public async getTopTracks(guildId: string, limit = 10) {
		return this.executeWithFallback(
			() => {
				let query = this.bunDb
					.select({
						trackId: schema.trackStats.trackId,
						title: schema.trackStats.title,
						author: schema.trackStats.author,
						playCount: sql<number>`sum(${schema.trackStats.playCount})`.as(
							"playCount",
						),
					})
					.from(schema.trackStats)
					.groupBy(
						schema.trackStats.trackId,
						schema.trackStats.title,
						schema.trackStats.author,
					)
					.orderBy(desc(sql`playCount`))
					.limit(limit);

				if (guildId) {
					query = query.where(
						eq(schema.trackStats.guildId, guildId),
					) as typeof query;
				}

				return query;
			},
			() => {
				let query = this.tursoDb
					.select({
						trackId: schema.trackStats.trackId,
						title: schema.trackStats.title,
						author: schema.trackStats.author,
						playCount: sql<number>`sum(${schema.trackStats.playCount})`.as(
							"playCount",
						),
					})
					.from(schema.trackStats)
					.groupBy(
						schema.trackStats.trackId,
						schema.trackStats.title,
						schema.trackStats.author,
					)
					.orderBy(desc(sql`playCount`))
					.limit(limit);

				if (guildId) {
					query = query.where(
						eq(schema.trackStats.guildId, guildId),
					) as typeof query;
				}

				return query;
			},
			`getTopTracks(${guildId})`,
		);
	}

	/**
	 * Get direct access to Bun database (for advanced operations)
	 */
	public getBunDb() {
		return this.bunDb;
	}

	/**
	 * Get direct access to Turso database (for advanced operations)
	 */
	public getTursoDb() {
		return this.tursoDb;
	}

	/**
	 * Check if databases are initialized
	 */
	public isReady(): boolean {
		return this.isInitialized;
	}

	/**
	 * Test database connections
	 */
	public async testConnections(): Promise<{ bun: boolean; turso: boolean }> {
		const results = { bun: false, turso: false };

		try {
			await this.bunDb.select().from(schema.guild).limit(1);
			results.bun = true;
		} catch (error) {
			logger.warn("Bun database test failed:", error);
		}

		try {
			await this.tursoDb.select().from(schema.guild).limit(1);
			results.turso = true;
		} catch (error) {
			logger.warn("Turso database test failed:", error);
		}

		return results;
	}

	/**
	 * Sync data from Turso to Bun SQLite (copy remote to local)
	 */
	public async sync(): Promise<{
		success: boolean;
		tablesSync: Record<string, { copied: number; errors: number }>;
		totalCopied: number;
		totalErrors: number;
	}> {
		const result = {
			success: false,
			tablesSync: {} as Record<string, { copied: number; errors: number }>,
			totalCopied: 0,
			totalErrors: 0,
		};

		function getTableSync(name: string) {
			if (!result.tablesSync[name]) {
				result.tablesSync[name] = { copied: 0, errors: 0 };
			}
			return result.tablesSync[name];
		}

		const tables = [
			{ name: "guild", schema: schema.guild },
			{ name: "likedSongs", schema: schema.likedSongs },
			{ name: "playlist", schema: schema.playlist },
			{ name: "playlistTrack", schema: schema.playlistTrack },
			{ name: "trackStats", schema: schema.trackStats },
			{ name: "userStats", schema: schema.userStats },
			{ name: "userVote", schema: schema.userVote },
		];

		logger.info("Starting Turso -> Bun SQLite sync...");

		for (const table of tables) {
			getTableSync(table.name);

			try {
				const tursoData = await this.tursoDb.select().from(table.schema).all();

				if (tursoData.length === 0) {
					logger.info(`Table ${table.name}: no data to sync`);
					continue;
				}

				await this.bunDb.delete(table.schema);

				const batchSize = 100;
				for (let i = 0; i < tursoData.length; i += batchSize) {
					const batch = tursoData.slice(i, i + batchSize);

					try {
						await this.bunDb.insert(table.schema).values(batch);
						getTableSync(table.name).copied += batch.length;
					} catch (error) {
						logger.error(`Batch insert failed for ${table.name}:`, error);
						getTableSync(table.name).errors += batch.length;
					}
				}

				const tableSync = getTableSync(table.name);
				logger.info(`Table ${table.name}: ${tableSync.copied} records synced`);
			} catch (error) {
				logger.error(`Failed to sync table ${table.name}:`, error);
				getTableSync(table.name).errors += 1;
			}
		}

		for (const tableName in result.tablesSync) {
			const tableResult = result.tablesSync[tableName];
			if (tableResult) {
				result.totalCopied += tableResult.copied;
				result.totalErrors += tableResult.errors;
			}
		}

		result.success = result.totalErrors === 0;

		logger.info(
			`Sync completed: ${result.totalCopied} records copied, ${result.totalErrors} errors`,
		);
		return result;
	}

	/**
	 * Get performance statistics
	 */
	public async getPerformanceStats() {
		const bunStart = performance.now();
		try {
			await this.bunDb.select().from(schema.guild).limit(1);
		} catch {}
		const bunTime = performance.now() - bunStart;

		const tursoStart = performance.now();
		try {
			await this.tursoDb.select().from(schema.guild).limit(1);
		} catch {}
		const tursoTime = performance.now() - tursoStart;

		return {
			bunLatency: Math.round(bunTime * 100) / 100,
			tursoLatency: Math.round(tursoTime * 100) / 100,
			speedImprovement: Math.round((tursoTime / bunTime) * 100) / 100,
		};
	}

	/**
	 * Cleanup and close connections
	 */
	public cleanup(): void {
		try {
			this.bunClient.close();
			logger.info("Bun-First Database cleanup completed");
		} catch (error) {
			logger.error("Error during cleanup:", error);
		}
	}
}

export const bunDatabase = new BunDatabase();
