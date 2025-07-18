import type { Logger } from "seyfert";
import type { Low } from "lowdb";
import type { DatabaseSchema, LyricsData } from "#soundy/types";
import type { DatabaseOperations } from ".";

/**
 * Lyrics data management operations
 */
export class LyricsManager {
	private db: Low<DatabaseSchema>;
	private logger: Logger;
	private dbOps: DatabaseOperations;

	constructor(
		db: Low<DatabaseSchema>,
		logger: Logger,
		dbOps: DatabaseOperations,
	) {
		this.db = db;
		this.logger = logger;
		this.dbOps = dbOps;
	}

	/**
	 * Save lyrics data for a player
	 */
	async saveLyricsData(guildId: string, lyricsData: LyricsData): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data.players[guildId]) {
				this.db.data.players[guildId] = { guildId };
			}

			const player = this.db.data.players[guildId];

			if (lyricsData.lyricsEnabled !== undefined) {
				player.lyricsEnabled = lyricsData.lyricsEnabled;
			}

			if (lyricsData.lyricsId !== undefined) {
				player.lyricsId = lyricsData.lyricsId;
			}

			if (lyricsData.lyricsRequester !== undefined) {
				player.lyricsRequester = lyricsData.lyricsRequester;
			}

			if (lyricsData.localeString !== undefined) {
				player.localeString = lyricsData.localeString;
			}

			if (lyricsData.lyrics !== undefined) {
				player.lyrics = lyricsData.lyrics;
			}

			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error("Error saving lyrics data:", error);
		}
	}

	/**
	 * Get lyrics data for a player
	 */
	async getLyricsData(guildId: string): Promise<LyricsData | null> {
		try {
			await this.dbOps.ensureReady();

			const player = this.db.data.players[guildId];
			if (!player) return null;

			return {
				lyricsEnabled: player.lyricsEnabled,
				lyricsId: player.lyricsId,
				lyricsRequester: player.lyricsRequester,
				localeString: player.localeString,
				lyrics: player.lyrics,
			};
		} catch (error) {
			this.logger.error("Error getting lyrics data:", error);
			return null;
		}
	}

	/**
	 * Clear lyrics data for a player
	 */
	async clearLyricsData(guildId: string): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			const player = this.db.data.players[guildId];
			if (!player) return;

			player.lyricsEnabled = undefined;
			player.lyricsId = undefined;
			player.lyricsRequester = undefined;
			player.lyrics = undefined;

			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error("Error clearing lyrics data:", error);
		}
	}
}
