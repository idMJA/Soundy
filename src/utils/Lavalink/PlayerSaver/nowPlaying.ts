import type { Low } from "lowdb";
import type { Logger } from "seyfert";
import type { DatabaseSchema, NowPlayingMessage } from "#soundy/types";
import type { DatabaseOperations } from ".";

/**
 * Now Playing message management operations
 */
export class NowPlayingManager {
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
	 * Get the last sent messageId and channelId for a guild from the database
	 */
	async getLastNowPlayingMessage(
		guildId: string,
	): Promise<NowPlayingMessage | null> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data || !this.db.data.players[guildId]) return null;

			const player = this.db.data.players[guildId];
			return {
				messageId: player.messageId,
				channelId: player.textChannelId,
			};
		} catch (error) {
			this.logger.error(
				`Error getting last now playing message for guild ${guildId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * Save the last sent messageId and channelId for a guild to the database
	 */
	async setLastNowPlayingMessage(
		guildId: string,
		messageId: string,
		channelId: string,
	): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data.players[guildId]) {
				this.db.data.players[guildId] = { guildId };
			}

			this.db.data.players[guildId].messageId = messageId;
			this.db.data.players[guildId].textChannelId = channelId;
			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error(
				`Error setting last now playing message for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Remove the last sent messageId for a guild from the database
	 */
	async clearLastNowPlayingMessage(guildId: string): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data || !this.db.data.players[guildId]) return;

			this.db.data.players[guildId].messageId = undefined;
			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error(
				`Error clearing last now playing message for guild ${guildId}:`,
				error,
			);
		}
	}
}
