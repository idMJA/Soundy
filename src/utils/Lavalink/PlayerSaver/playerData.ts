import type { Logger } from "seyfert";
import type { Low } from "lowdb";
import type { DatabaseSchema, PlayerData, QueueTrack } from "#soundy/types";
import type { DatabaseOperations } from ".";

/**
 * Player data management operations
 */
export class PlayerDataManager {
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
	 * Save player data to the database
	 */
	async savePlayer(guildId: string, playerData: PlayerData): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			// Make sure players object exists
			if (!this.db.data.players) {
				this.db.data.players = {};
			}

			// Save player data
			this.db.data.players[guildId] = playerData;

			// Write changes
			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error(
				`Error saving player data for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Get player data for a specific guild
	 */
	async getPlayer(guildId: string): Promise<PlayerData | null> {
		try {
			await this.dbOps.ensureReady();

			// Check if data structure exists
			if (!this.db.data || !this.db.data.players) {
				return null;
			}

			// Return player data if it exists
			return this.db.data.players[guildId] || null;
		} catch (error) {
			this.logger.error(
				`Error getting player data for guild ${guildId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * Delete player data for a specific guild
	 */
	async delPlayer(guildId: string): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			// Check if data structure exists
			if (!this.db.data || !this.db.data.players) {
				return;
			}

			// Delete player data
			delete this.db.data.players[guildId];

			// Write changes
			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error(
				`Error deleting player data for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Update queue tracks for a guild in the database
	 */
	async updatePlayerQueue(
		guildId: string,
		queueTracks: Array<QueueTrack>,
	): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data.players[guildId]) {
				this.db.data.players[guildId] = { guildId };
			}

			this.db.data.players[guildId].queue = queueTracks;
			await this.dbOps.writeChanges();
			this.logger.info(`Updated queue for guild ${guildId} in sessions.json`);
		} catch (error) {
			this.logger.error(`Error updating queue for guild ${guildId}:`, error);
		}
	}
}
