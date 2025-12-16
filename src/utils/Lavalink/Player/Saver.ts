import path from "node:path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { Logger } from "seyfert";
import type {
	DatabaseSchema,
	LyricsData,
	NowPlayingMessage,
	PlayerData,
	QueueTrack,
} from "#soundy/types";
import {
	DatabaseOperations,
	LyricsManager,
	NodeSessionManager,
	NowPlayingManager,
	PlayerDataManager,
	PlayerSaverUtils,
} from "../PlayerSaver";

export class PlayerSaver {
	private db: Low<DatabaseSchema>;
	private isReady = false;
	private logger: Logger;
	private utils: PlayerSaverUtils;
	private dbOps: DatabaseOperations;
	private nodeSessionManager: NodeSessionManager;
	private playerDataManager: PlayerDataManager;
	private nowPlayingManager: NowPlayingManager;
	private lyricsManager: LyricsManager;

	constructor(logger: Logger) {
		this.logger = logger;
		this.utils = new PlayerSaverUtils(logger);

		const file = path.resolve(process.cwd(), "sessions.json");
		const adapter = new JSONFile<DatabaseSchema>(file);
		this.db = new Low(adapter, { players: {}, sessions: {} });

		this.dbOps = new DatabaseOperations(this.db, logger);
		this.nodeSessionManager = new NodeSessionManager(
			this.db,
			logger,
			this.dbOps,
		);
		this.playerDataManager = new PlayerDataManager(this.db, logger, this.dbOps);
		this.nowPlayingManager = new NowPlayingManager(this.db, logger, this.dbOps);
		this.lyricsManager = new LyricsManager(this.db, logger, this.dbOps);

		this.init()
			.then(() => {
				this.isReady = true;
				// this.logger.info("PlayerSaver database initialized successfully");
			})
			.catch((error) => {
				this.logger.error("Failed to initialize PlayerSaver database:", error);
				this.isReady = true;
			});
	}

	public isDbReady(): boolean {
		return this.isReady;
	}

	public async waitForReady(): Promise<void> {
		if (this.isReady) return;

		return new Promise((resolve) => {
			const checkReady = () => {
				if (this.isReady) {
					resolve();
				} else {
					setTimeout(checkReady, 50);
				}
			};

			checkReady();
		});
	}

	private async init() {
		await this.dbOps.init();
	}

	/**
	 * Clean up node sessions that don't exist in the provided node IDs
	 * @param validNodeIds Array of valid node IDs from nodes.ts
	 */
	async cleanupNodeSessions(validNodeIds: string[]): Promise<void> {
		// Ensure database is ready
		await this.waitForReady();
		await this.nodeSessionManager.cleanupNodeSessions(validNodeIds);
	}

	/**
	 * Safely extract necessary data from player object to avoid circular references
	 */
	public extractSafePlayerData(
		playerData: Record<string, unknown>,
	): PlayerData {
		return this.utils.extractSafePlayerData(playerData);
	}

	/**
	 * Save player data to the database
	 */
	async savePlayer(guildId: string, playerData: PlayerData) {
		// Ensure database is ready
		await this.waitForReady();
		await this.playerDataManager.savePlayer(guildId, playerData);
	}

	/**
	 * Save node session ID to the database
	 */
	async saveNodeSession(nodeId: string, sessionId: string) {
		// Ensure database is ready
		await this.waitForReady();
		await this.nodeSessionManager.saveNodeSession(nodeId, sessionId);
	}

	/**
	 * Get all saved node sessions
	 */
	async getAllNodeSessions(): Promise<Map<string, string>> {
		// Ensure database is ready
		await this.waitForReady();
		return await this.nodeSessionManager.getAllNodeSessions();
	}

	/**
	 * Get player data for a specific guild
	 */
	async getPlayer(guildId: string): Promise<PlayerData | null> {
		// Ensure database is ready
		await this.waitForReady();
		return await this.playerDataManager.getPlayer(guildId);
	}

	/**
	 * Delete player data for a specific guild
	 */
	async delPlayer(guildId: string): Promise<void> {
		// Ensure database is ready
		await this.waitForReady();
		await this.playerDataManager.delPlayer(guildId);
	}

	/**
	 * Get a session ID for a specific node
	 */
	async getNodeSession(nodeId: string): Promise<string | null> {
		// Ensure database is ready
		await this.waitForReady();
		return await this.nodeSessionManager.getNodeSession(nodeId);
	}

	/**
	 * Update queue tracks for a guild in the database
	 */
	async updatePlayerQueue(guildId: string, queueTracks: Array<QueueTrack>) {
		await this.waitForReady();
		await this.playerDataManager.updatePlayerQueue(guildId, queueTracks);
	}

	/**
	 * Get the last sent messageId and channelId for a guild from the database
	 */
	public async getLastNowPlayingMessage(
		guildId: string,
	): Promise<NowPlayingMessage | null> {
		await this.waitForReady();
		return await this.nowPlayingManager.getLastNowPlayingMessage(guildId);
	}

	/**
	 * Save the last sent messageId and channelId for a guild to the database
	 */
	public async setLastNowPlayingMessage(
		guildId: string,
		messageId: string,
		channelId: string,
	) {
		await this.waitForReady();
		await this.nowPlayingManager.setLastNowPlayingMessage(
			guildId,
			messageId,
			channelId,
		);
	}

	/**
	 * Remove the last sent messageId for a guild from the database
	 */
	public async clearLastNowPlayingMessage(guildId: string) {
		await this.waitForReady();
		await this.nowPlayingManager.clearLastNowPlayingMessage(guildId);
	}

	/**
	 * Save lyrics data for a player
	 */
	public async saveLyricsData(guildId: string, lyricsData: LyricsData) {
		await this.waitForReady();
		await this.lyricsManager.saveLyricsData(guildId, lyricsData);
	}

	/**
	 * Get lyrics data for a player
	 */
	public async getLyricsData(guildId: string): Promise<LyricsData | null> {
		await this.waitForReady();
		return await this.lyricsManager.getLyricsData(guildId);
	}

	/**
	 * Clear lyrics data for a player
	 */
	public async clearLyricsData(guildId: string) {
		await this.waitForReady();
		await this.lyricsManager.clearLyricsData(guildId);
	}
}
