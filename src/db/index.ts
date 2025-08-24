import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { Configuration, Environment } from "#soundy/config";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const client = createClient({
	url:
		Environment.DatabaseUrl ?? "Hmm? Looks like the database URL is missing.",
	authToken: Environment.DatabasePassword,
});

export const db = drizzle(client);

export interface ISetup {
	id: string;
	guildId: string;
	channelId: string;
	messageId: string;
	createdAt: Date;
}

export class SoundyDatabase {
	public db = db;
	private cache = new Map<
		string,
		{ locale?: string; defaultVolume?: number }
	>();

	/**
	 * Get the locale for a guild from the database, or return default if not found.
	 * @param guildId Guild ID
	 * @returns locale string
	 */
	public async getLocale(guildId: string): Promise<string> {
		const cached = this.cache.get(guildId)?.locale;
		if (cached) return cached;
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		if (data?.locale) {
			this.cache.set(guildId, {
				...this.cache.get(guildId),
				locale: data.locale,
			});
			return data.locale;
		}
		return Configuration.defaultLocale ?? "en-US";
	}

	/**
	 * Get the guild player from the database.
	 * @param guildId The guild id.
	 */
	public async getPlayer(guildId: string): Promise<{ defaultVolume: number }> {
		const cached = this.cache.get(guildId)?.defaultVolume;
		if (cached !== undefined) {
			return { defaultVolume: cached };
		}
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		const defaultVolume = data?.defaultVolume ?? Configuration.defaultVolume;
		this.cache.set(guildId, { ...this.cache.get(guildId), defaultVolume });
		return { defaultVolume };
	}

	/**
	 * Get premium status details for a user
	 * @param userId The user ID
	 */
	public async getPremiumStatus(
		userId: string,
	): Promise<{ type: string; timeRemaining: number } | null> {
		const now = new Date().toISOString();
		// Check for regular premium first, then fall back to vote premium
		let vote = await this.db
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
			// If no regular premium, check for vote premium
			vote = await this.db
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

		if (!vote) return null;

		return {
			type: vote.type,
			timeRemaining: new Date(vote.expiresAt).getTime() - Date.now(),
		};
	}

	/**
	 * Get the prefix for a guild from the database, or return default if not found.
	 * @param guildId Guild ID
	 * @returns prefix string
	 */
	public async getPrefix(guildId: string): Promise<string> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.prefix ?? Configuration.defaultPrefix;
	}

	/**
	 * Get the setup data for a guild
	 * @param guildId The guild ID
	 */
	public async getSetup(guildId: string): Promise<ISetup | null> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.setupChannelId && data?.setupTextId
			? {
					id: data.id,
					guildId: data.id,
					channelId: data.setupChannelId,
					messageId: data.setupTextId,
					createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
				}
			: null;
	}

	/**
	 * Create a new setup for a guild
	 * @param guildId The guild ID
	 * @param channelId The channel ID
	 * @param messageId The message ID
	 */
	public async createSetup(
		guildId: string,
		channelId: string,
		messageId: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				setupChannelId: channelId,
				setupTextId: messageId,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { setupChannelId: channelId, setupTextId: messageId },
			});
	}

	/**
	 * Delete a setup for a guild
	 * @param guildId The guild ID
	 */
	public async deleteSetup(guildId: string): Promise<void> {
		await this.db
			.update(schema.guild)
			.set({ setupChannelId: null, setupTextId: null })
			.where(eq(schema.guild.id, guildId))
			.catch(() => null); // Ignore if not found
	}

	/**
	 * Get the 24/7 mode settings for a guild
	 * @param guildId The guild ID
	 */
	public async get247Mode(
		guildId: string,
	): Promise<{ enabled: boolean; channelId?: string; textId?: string } | null> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();

		return data
			? {
					enabled: data.enabled247,
					channelId: data.channel247Id ?? undefined,
					textId: data.text247Id ?? undefined,
				}
			: null;
	}

	/**
	 * Set 24/7 mode for a guild
	 * @param guildId The guild ID
	 * @param enabled Whether 24/7 mode is enabled
	 * @param channelId The voice channel ID (optional)
	 * @param textId The text channel ID (optional)
	 */
	public async set247Mode(
		guildId: string,
		enabled: boolean,
		channelId?: string,
		textId?: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				enabled247: enabled,
				channel247Id: channelId,
				text247Id: textId,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: {
					enabled247: enabled,
					channel247Id: channelId,
					text247Id: textId,
				},
			});
	}

	/**
	 * Update the last voice channel for 24/7 mode
	 * @param guildId The guild ID
	 * @param channelId The voice channel ID
	 * @param textId The text channel ID
	 */
	public async update247Channel(
		guildId: string,
		channelId: string,
		textId: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				enabled247: true,
				channel247Id: channelId,
				text247Id: textId,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { channel247Id: channelId, text247Id: textId },
			});
	}

	/**
	 * Get voice status for a guild
	 * @param guildId The guild ID
	 */
	public async getVoiceStatus(guildId: string): Promise<boolean> {
		const data = await this.db
			.select({ voiceStatus: schema.guild.voiceStatus })
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();

		return data?.voiceStatus ?? true; // Default to enabled if not set
	}

	/**
	 * Set voice status for a guild
	 * @param guildId The guild ID
	 * @param enabled Whether voice is enabled
	 */
	public async setVoiceStatus(
		guildId: string,
		enabled: boolean,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				voiceStatus: enabled,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { voiceStatus: enabled },
			});
	}

	/**
	 * Update track statistics
	 * @param trackId The track URL
	 * @param title The track title
	 * @param author The track author
	 * @param guildId The guild ID
	 * @param userId The user ID who played the track
	 * @param uri The track URI
	 * @param artwork The track artwork URL
	 * @param length The track length in milliseconds
	 * @param isStream Whether the track is a stream
	 */
	public async updateTrackStats(
		trackId: string,
		title: string,
		author: string,
		guildId: string,
		userId: string,
		uri?: string,
		artwork?: string,
		length?: number,
		isStream?: boolean,
	): Promise<void> {
		const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

		// Clean up old records first
		await this.db
			.delete(schema.trackStats)
			.where(eq(schema.trackStats.lastPlayed, twoWeeksAgo.toISOString()));

		const now = new Date().toISOString();

		// Check if track exists for this guild and user combination
		const existingTrack = await this.db
			.select()
			.from(schema.trackStats)
			.where(
				and(
					eq(schema.trackStats.trackId, trackId),
					eq(schema.trackStats.guildId, guildId),
					eq(schema.trackStats.userId, userId),
				),
			)
			.get();

		if (existingTrack) {
			// Update existing track
			await this.db
				.update(schema.trackStats)
				.set({
					playCount: existingTrack.playCount + 1,
					lastPlayed: now,
					// Update additional fields if provided
					...(uri && { uri }),
					...(artwork && { artwork }),
					...(length && { length }),
					...(isStream !== undefined && { isStream }),
				})
				.where(eq(schema.trackStats.id, existingTrack.id));
		} else {
			// Insert new track
			await this.db.insert(schema.trackStats).values({
				id: randomUUID(),
				guildId,
				userId,
				title,
				author,
				trackId,
				uri: uri || "",
				artwork: artwork || null,
				length: length || null,
				isStream: isStream || false,
				playCount: 1,
				lastPlayed: now,
				createdAt: now,
			});
		}
	}

	/**
	 * Update user statistics
	 * @param userId The user ID
	 * @param guildId The guild ID
	 */
	public async updateUserStats(userId: string, guildId: string): Promise<void> {
		const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

		// Clean up old records first
		await this.db
			.delete(schema.userStats)
			.where(eq(schema.userStats.lastPlayed, twoWeeksAgo.toISOString()));

		const now = new Date().toISOString();

		// Check if user stats exists for this guild
		const existingStats = await this.db
			.select()
			.from(schema.userStats)
			.where(
				and(
					eq(schema.userStats.userId, userId),
					eq(schema.userStats.guildId, guildId),
				),
			)
			.get();

		if (existingStats) {
			// Update existing stats
			await this.db
				.update(schema.userStats)
				.set({
					playCount: existingStats.playCount + 1,
					lastPlayed: now,
				})
				.where(eq(schema.userStats.id, existingStats.id));
		} else {
			// Insert new stats
			await this.db.insert(schema.userStats).values({
				id: randomUUID(),
				userId,
				guildId,
				playCount: 1,
				lastPlayed: now,
				createdAt: now,
			});
		}
	}

	/**
	 * Get top tracks globally or for a specific guild
	 * @param guildId The guild ID (empty string for global stats)
	 * @param limit Number of tracks to return
	 */
	public async getTopTracks(guildId: string, limit = 10) {
		const query = this.db
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
			query.where(eq(schema.trackStats.guildId, guildId));
		}

		return await query;
	}

	/**
	 * Get top users globally or for a specific guild
	 * @param guildId The guild ID (empty string for global stats)
	 * @param limit Number of users to return
	 */
	public async getTopUsers(guildId: string, limit = 10) {
		const query = this.db
			.select({
				userId: schema.userStats.userId,
				playCount: sql<number>`sum(${schema.userStats.playCount})`.as(
					"playCount",
				),
			})
			.from(schema.userStats)
			.groupBy(schema.userStats.userId)
			.orderBy(desc(sql`playCount`))
			.limit(limit);

		if (guildId) {
			query.where(eq(schema.userStats.guildId, guildId));
		}

		return await query;
	}

	/**
	 * Get top guilds by music activity
	 * @param limit Number of guilds to return
	 */
	public async getTopGuilds(limit = 10) {
		return await this.db
			.select({
				guildId: schema.userStats.guildId,
				totalPlays: sql<number>`sum(${schema.userStats.playCount})`.as(
					"totalPlays",
				),
				uniqueTracks:
					sql<number>`count(distinct ${schema.trackStats.trackId})`.as(
						"uniqueTracks",
					),
			})
			.from(schema.userStats)
			.leftJoin(
				schema.trackStats,
				eq(schema.userStats.guildId, schema.trackStats.guildId),
			)
			.groupBy(schema.userStats.guildId)
			.orderBy(desc(sql`totalPlays`))
			.limit(limit);
	}

	/**
	 * Get a playlist by user ID and name
	 * @param userId The user ID
	 * @param name The playlist name
	 */
	public async getPlaylist(userId: string, name: string) {
		const playlist = await this.db
			.select()
			.from(schema.playlist)
			.where(
				and(eq(schema.playlist.userId, userId), eq(schema.playlist.name, name)),
			)
			.get();

		if (!playlist) return null;

		const tracks = await this.db
			.select()
			.from(schema.playlistTrack)
			.where(eq(schema.playlistTrack.playlistId, playlist.id))
			.all();

		return { ...playlist, tracks };
	}

	/**
	 * Get a playlist by playlist ID
	 * @param playlistId The playlist ID
	 */
	public async getPlaylistById(playlistId: string) {
		const playlist = await this.db
			.select()
			.from(schema.playlist)
			.where(eq(schema.playlist.id, playlistId))
			.get();

		if (!playlist) return null;

		const tracks = await this.db
			.select()
			.from(schema.playlistTrack)
			.where(eq(schema.playlistTrack.playlistId, playlist.id))
			.all();

		return { ...playlist, tracks };
	}

	/**
	 * Get all playlists for a user
	 * @param userId The user ID
	 */
	public async getPlaylists(userId: string) {
		const playlists = await this.db
			.select()
			.from(schema.playlist)
			.where(eq(schema.playlist.userId, userId))
			.all();

		const playlistsWithTracks = await Promise.all(
			playlists.map(async (playlist) => {
				const tracks = await this.db
					.select()
					.from(schema.playlistTrack)
					.where(eq(schema.playlistTrack.playlistId, playlist.id))
					.all();
				return { ...playlist, tracks };
			}),
		);

		return playlistsWithTracks;
	}

	/**
	 * Create a new playlist
	 * @param userId The user ID
	 * @param name The playlist name
	 */
	public async createPlaylist(userId: string, name: string): Promise<boolean> {
		try {
			await this.db.insert(schema.playlist).values({
				id: crypto.randomUUID(),
				userId,
				name,
			});
			return true;
		} catch (error) {
			if (
				typeof error === "object" &&
				error !== null &&
				"code" in error &&
				(error as { code?: string }).code === "SQLITE_CONSTRAINT"
			) {
				console.error(
					"SQLite constraint error while creating playlist:",
					error,
				);
				return false;
			}
			throw error;
		}
	}

	/**
	 * Delete a playlist by id
	 * @param userId The user ID
	 * @param id The playlist id (primary key)
	 */
	public async deletePlaylist(userId: string, id: string) {
		await this.db
			.delete(schema.playlist)
			.where(
				and(eq(schema.playlist.userId, userId), eq(schema.playlist.id, id)),
			);
	}

	/**
	 * Add tracks to a playlist by ID
	 * @param playlistId The playlist ID
	 * @param tracks Array of track objects with URL and info
	 */
	public async addTracksToPlaylist(
		playlistId: string,
		tracks: Array<{ url: string; info?: object }>,
	) {
		const playlist = await this.getPlaylistById(playlistId);
		if (!playlist) return;

		const trackValues = tracks.map((track) => ({
			id: randomUUID(),
			playlistId: playlistId,
			url: track.url,
			info: track.info ? JSON.stringify(track.info) : null,
		}));

		await this.db.insert(schema.playlistTrack).values(trackValues);
	}

	/**
	 * Remove a track from a playlist by playlist ID and track ID
	 * @param playlistId The playlist ID
	 * @param trackId The track id (primary key in playlistTrack)
	 */
	public async removeSong(playlistId: string, trackId: string) {
		await this.db
			.delete(schema.playlistTrack)
			.where(
				and(
					eq(schema.playlistTrack.playlistId, playlistId),
					eq(schema.playlistTrack.id, trackId),
				),
			);
	}

	/**
	 * Get tracks from a playlist by ID
	 * @param playlistId The playlist ID
	 */
	public async getTracksFromPlaylist(playlistId: string) {
		const playlist = await this.getPlaylistById(playlistId);
		if (!playlist) return null;

		return playlist.tracks.map((track) => ({
			url: track.url,
			info: track.info ? JSON.parse(track.info) : null,
		}));
	}

	/**
	 * Add or update a user's vote status
	 * @param userId The user ID
	 */
	public async addUserVote(userId: string): Promise<void> {
		const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
		const expiresAt = new Date(Date.now() + TWELVE_HOURS);
		const now = new Date().toISOString();

		// Check if user already has an active vote
		const existingVote = await this.db
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
			// Update existing vote expiration time
			await this.db
				.update(schema.userVote)
				.set({
					expiresAt: expiresAt.toISOString(),
					votedAt: now,
				})
				.where(eq(schema.userVote.id, existingVote.id));
		} else {
			// Insert new vote record
			await this.db.insert(schema.userVote).values({
				id: randomUUID(),
				userId,
				expiresAt: expiresAt.toISOString(),
				type: "vote",
				votedAt: now,
			});
		}
	}

	/**
	 * Add regular premium access for a user
	 * @param userId The user ID
	 * @param durationMs Duration in milliseconds
	 */
	public async addRegularPremium(
		userId: string,
		durationMs: number,
	): Promise<void> {
		const expiresAt = new Date(Date.now() + durationMs);
		const now = new Date().toISOString();

		await this.db.insert(schema.userVote).values({
			id: randomUUID(),
			userId,
			expiresAt: expiresAt.toISOString(),
			type: "regular",
			votedAt: now,
		});
	}

	/**
	 * Add premium (vote or regular) for a user
	 * @param userId The user ID
	 * @param type 'vote' or 'regular'
	 * @param durationMs Duration in milliseconds (for 'regular'), ignored for 'vote'
	 */
	public async addPremium(
		userId: string,
		type: "vote" | "regular",
		durationMs?: number,
	): Promise<void> {
		const now = new Date().toISOString();
		let expiresAt: string;
		if (type === "regular") {
			if (!durationMs)
				throw new Error("durationMs is required for regular premium");
			expiresAt = new Date(Date.now() + durationMs).toISOString();
		} else {
			// vote premium: 12 hours
			expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
		}
		await this.db.insert(schema.userVote).values({
			id: randomUUID(),
			userId,
			expiresAt,
			type,
			votedAt: now,
		});
	}

	/**
	 * Check if a user has an active premium status
	 * @param userId The user ID
	 */
	public async hasActivePremium(userId: string): Promise<boolean> {
		const now = new Date().toISOString();
		const vote = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.orderBy(desc(schema.userVote.expiresAt))
			.get();

		return !!vote;
	}

	/**
	 * Clean up expired premium entries
	 */
	public async cleanupExpiredVotes(): Promise<void> {
		const now = new Date().toISOString();
		await this.db
			.delete(schema.userVote)
			.where(sql`${schema.userVote.expiresAt} <= ${now}`);
	}

	/**
	 * Get time remaining for premium status
	 * @param userId The user ID
	 */
	public async getPremiumTimeRemaining(userId: string): Promise<number | null> {
		const now = new Date().toISOString();

		// Check for regular premium first, then fall back to vote premium
		let vote = await this.db
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
			// If no regular premium, check for vote premium
			vote = await this.db
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

		if (!vote) return null;
		return new Date(vote.expiresAt).getTime() - Date.now();
	}

	/**
	 * Clear vote data for a specific user
	 * @param userId The user ID
	 */
	public async clearVoteData(userId: string): Promise<void> {
		await this.db
			.delete(schema.userVote)
			.where(eq(schema.userVote.userId, userId));
	}

	/**
	 * Clear playlist data for a specific user
	 * @param userId The user ID
	 */
	public async clearPlaylistData(userId: string): Promise<void> {
		await this.db
			.delete(schema.playlist)
			.where(eq(schema.playlist.userId, userId));
	}

	/**
	 * Clear premium data for a specific user
	 * @param userId The user ID
	 */
	public async clearPremiumData(userId: string): Promise<void> {
		await this.db
			.delete(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					eq(schema.userVote.type, "regular"),
				),
			);
	}

	/**
	 * Clear stats data
	 */
	public async clearStatsData(): Promise<void> {
		await Promise.all([
			this.db.delete(schema.trackStats),
			this.db.delete(schema.userStats),
		]);
	}

	/**
	 * Clear all data for a specific user or all users
	 * @param userId Optional user ID to clear data for specific user
	 */
	public async clearAllData(userId?: string): Promise<void> {
		if (userId) {
			await Promise.all([
				this.db
					.delete(schema.userVote)
					.where(eq(schema.userVote.userId, userId)),
				this.db
					.delete(schema.playlist)
					.where(eq(schema.playlist.userId, userId)),
				this.db
					.delete(schema.userStats)
					.where(eq(schema.userStats.userId, userId)),
			]);
			return;
		}

		await Promise.all([
			this.db.delete(schema.userVote),
			this.db.delete(schema.playlist),
			this.db.delete(schema.playlistTrack),
			this.db.delete(schema.trackStats),
			this.db.delete(schema.userStats),
		]);
	}

	/**
	 * Get vote statistics
	 * @param userId Optional user ID for specific user stats
	 */
	public async getVoteStats(userId?: string) {
		const query = this.db.select().from(schema.userVote);

		if (userId) {
			query.where(eq(schema.userVote.userId, userId));
		}

		const votes = await query.all();
		const activeVotes = votes.filter(
			(vote) => new Date(vote.expiresAt) > new Date(),
		);

		return {
			total: votes.length,
			active: activeVotes.length,
		};
	}

	/**
	 * Get playlist statistics
	 * @param userId Optional user ID for specific user stats
	 */
	public async getPlaylistStats(userId?: string) {
		const query = this.db.select().from(schema.playlist);
		if (userId) {
			query.where(eq(schema.playlist.userId, userId));
		}
		const playlists = await query.all();
		const tracks = await this.db.select().from(schema.playlistTrack).all();

		return {
			playlists: playlists.length,
			tracks: tracks.length,
		};
	}

	/**
	 * Get premium statistics
	 * @param userId Optional user ID for specific user stats
	 */
	public async getPremiumStats(userId?: string) {
		const now = new Date().toISOString();
		if (userId) {
			// Check for regular premium first
			let premium = await this.db
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

			// If no regular premium, check for vote premium
			if (!premium) {
				premium = await this.db
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

			return {
				active: !!premium,
				expiresAt: premium ? new Date(premium.expiresAt) : null,
				type: premium ? premium.type : null,
			};
		}

		// Get count of unique users with active premium
		const activeRegularUsers = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.type, "regular"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.groupBy(schema.userVote.userId)
			.all();

		const activeVoteUsers = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.type, "vote"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.groupBy(schema.userVote.userId)
			.all();

		return {
			activeRegularUsers: activeRegularUsers.length,
			activeVoteUsers: activeVoteUsers.length,
			totalActiveUsers: activeRegularUsers.length + activeVoteUsers.length,
		};
	}

	/**
	 * Get general statistics
	 */
	public async getGeneralStats() {
		const [trackStats, userStats] = await Promise.all([
			this.db.select().from(schema.trackStats).all(),
			this.db.select().from(schema.userStats).all(),
		]);

		return {
			trackStats: trackStats.length,
			userStats: userStats.length,
		};
	}

	/**
	 * Set the guild locale to the database.
	 * @param guildId The guild id.
	 * @param locale The locale.
	 */
	public async setLocale(guildId: string, locale: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, locale })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { locale },
			});
	}

	/**
	 * Set the guild prefix to the database.
	 * @param guildId The guild id.
	 * @param prefix The prefix.
	 */
	public async setPrefix(guildId: string, prefix: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, prefix })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { prefix },
			});
	}

	/**
	 * Delete the guild prefix from the database (reset to default).
	 * @param guildId The guild id.
	 */
	public async deletePrefix(guildId: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, prefix: null })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { prefix: null },
			});
	}

	/**
	 * Get recently played tracks for a user, optionally filtered by guild
	 * @param userId The user ID
	 * @param guildId Optional guild ID filter
	 * @param limit Number of tracks to return (default 10)
	 */
	public async getRecentlyPlayed(
		userId: string,
		guildId?: string,
		limit = 10,
	): Promise<
		Array<{
			id: string;
			title: string;
			author: string;
			uri: string;
			artwork?: string;
			length?: number;
			isStream: boolean;
			playedAt: string;
			guildId: string;
		}>
	> {
		let query = this.db
			.select()
			.from(schema.trackStats)
			.where(eq(schema.trackStats.userId, userId))
			.orderBy(desc(schema.trackStats.lastPlayed))
			.limit(limit);

		if (guildId) {
			query = this.db
				.select()
				.from(schema.trackStats)
				.where(
					and(
						eq(schema.trackStats.userId, userId),
						eq(schema.trackStats.guildId, guildId),
					),
				)
				.orderBy(desc(schema.trackStats.lastPlayed))
				.limit(limit);
		}

		const results = await query;

		return results.map((track) => ({
			id: track.trackId,
			title: track.title,
			author: track.author,
			uri: track.uri || "",
			artwork: track.artwork || undefined,
			length: track.length || undefined,
			isStream: !!track.isStream,
			playedAt: track.lastPlayed || new Date().toISOString(),
			guildId: track.guildId,
		}));
	}

	/**
	 * Clear recently played tracks for a user
	 * @param userId The user ID
	 * @param guildId Optional guild ID to only clear tracks from that guild
	 */
	public async clearRecentlyPlayed(
		userId: string,
		guildId?: string,
	): Promise<void> {
		if (guildId) {
			await this.db
				.delete(schema.trackStats)
				.where(
					and(
						eq(schema.trackStats.userId, userId),
						eq(schema.trackStats.guildId, guildId),
					),
				);
		} else {
			await this.db
				.delete(schema.trackStats)
				.where(eq(schema.trackStats.userId, userId));
		}
	}

	/**
	 * Add a track to user's liked songs
	 * @param userId The user ID
	 * @param trackId The track ID
	 * @param title The track title
	 * @param author The track author
	 * @param uri The track URI
	 * @param artwork The track artwork URL
	 * @param length The track length in milliseconds
	 * @param isStream Whether the track is a stream
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
		try {
			// Check if already liked
			const existing = await this.db
				.select()
				.from(schema.likedSongs)
				.where(
					and(
						eq(schema.likedSongs.userId, userId),
						eq(schema.likedSongs.trackId, trackId),
					),
				)
				.get();

			if (existing) {
				return false; // Already liked
			}

			await this.db.insert(schema.likedSongs).values({
				id: randomUUID(),
				userId,
				trackId,
				title,
				author,
				uri,
				artwork: artwork || null,
				length: length || null,
				isStream: isStream || false,
				likedAt: new Date().toISOString(),
			});

			return true; // Successfully added
		} catch (error) {
			console.error("Error adding to liked songs:", error);
			return false;
		}
	}

	/**
	 * Remove a track from user's liked songs by id
	 * @param userId The user ID
	 * @param id The liked song id (primary key)
	 */
	public async removeFromLikedSongs(
		userId: string,
		id: string,
	): Promise<boolean> {
		try {
			await this.db
				.delete(schema.likedSongs)
				.where(
					and(
						eq(schema.likedSongs.userId, userId),
						eq(schema.likedSongs.id, id),
					),
				);

			return true; // Successfully removed
		} catch (error) {
			console.error("Error removing from liked songs:", error);
			return false;
		}
	}

	/**
	 * Check if a track is liked by user
	 * @param userId The user ID
	 * @param trackId The track ID
	 */
	public async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
		try {
			const existing = await this.db
				.select()
				.from(schema.likedSongs)
				.where(
					and(
						eq(schema.likedSongs.userId, userId),
						eq(schema.likedSongs.trackId, trackId),
					),
				)
				.get();

			return !!existing;
		} catch (error) {
			console.error("Error checking liked status:", error);
			return false;
		}
	}

	/**
	 * Get user's liked songs
	 * @param userId The user ID
	 * @param limit The maximum number of results to return
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
		try {
			const likedSongs = await this.db
				.select()
				.from(schema.likedSongs)
				.where(eq(schema.likedSongs.userId, userId))
				.orderBy(desc(schema.likedSongs.likedAt))
				.limit(limit);

			return likedSongs.map((track) => ({
				id: track.id,
				trackId: track.trackId,
				title: track.title,
				author: track.author,
				uri: track.uri,
				artwork: track.artwork,
				length: track.length,
				isStream: !!track.isStream,
				likedAt: track.likedAt ?? new Date().toISOString(),
			}));
		} catch (error) {
			console.error("Error fetching liked songs:", error);
			return [];
		}
	}

	/**
	 * Get count of user's liked songs
	 * @param userId The user ID
	 */
	public async getLikedSongsCount(userId: string): Promise<number> {
		try {
			const result = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(schema.likedSongs)
				.where(eq(schema.likedSongs.userId, userId))
				.get();

			return result?.count || 0;
		} catch (error) {
			console.error("Error getting liked songs count:", error);
			return 0;
		}
	}
}

export const database = new SoundyDatabase();

export * from "./schema";
