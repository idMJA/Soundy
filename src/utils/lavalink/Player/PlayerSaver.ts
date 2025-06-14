import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import type { Logger } from "seyfert";

// Define player data interface for what we expect from the player object
// Tambahkan properti opsional messageId pada PlayerData agar type-safe
interface PlayerData {
	guildId: string;
	voiceChannelId?: string;
	textChannelId?: string;
	messageId?: string; // <--- simpan now playing buat diapus pake trackEnd, queueEnd, playerDestroy
	nodeId?: string;
	nodeSessionId?: string;
	volume?: number;
	options?: {
		selfDeaf?: boolean;
		selfMute?: boolean;
		applyVolumeAsFilter?: boolean;
		instaUpdateFiltersFix?: boolean;
		vcRegion?: string;
	};
	repeatMode?: "off" | "track" | "queue"; // <-- Tambahkan repeatMode
	enabledAutoplay?: boolean; // <-- Add this line for autoplay persistence
	track?:
		| string
		| {
				encoded?: string;
				info?: {
					title?: string;
					uri?: string;
					length?: number;
					thumbnail?: string;
					artworkUrl?: string;
				};
				requester?: { id: unknown } | string | null;
		  };
	queue?: Array<{
		encoded?: string;
		info?: {
			title?: string;
			uri?: string;
			author?: string;
			length?: number;
			identifier?: string;
			isStream?: boolean;
			isSeekable?: boolean;
			sourceName?: string;
			thumbnail?: string;
			artworkUrl?: string;
		};
		requester?: { id: unknown } | string | null;
	}>;
}

// Define data structure for the database
interface DatabaseSchema {
	players: Record<string, PlayerData>;
	sessions: Record<string, string>; // nodeId -> sessionId
}

export class PlayerSaver {
	private db: Low<DatabaseSchema>;
	private isReady = false;
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;

		// Set up lowdb with JSONFile adapter
		const file = path.resolve(process.cwd(), "sessions.json"); // Pastikan tidak ada dot di depan
		const adapter = new JSONFile<DatabaseSchema>(file);
		this.db = new Low(adapter, { players: {}, sessions: {} });

		// Initialize the database
		this.init()
			.then(() => {
				this.isReady = true;
				// this.logger.info("PlayerSaver database initialized successfully");
			})
			.catch((error) => {
				this.logger.error("Failed to initialize PlayerSaver database:", error);
				// Still mark as ready to allow operations with default empty data
				this.isReady = true;
			});
	}

	// Add a method to check if the database is ready
	public isDbReady(): boolean {
		return this.isReady;
	}

	// Wait for the database to be ready
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
		try {
			// Load existing data
			await this.db.read();

			// Ensure the data structure exists
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			} else {
				// Make sure both players and sessions objects exist
				if (!this.db.data.players) this.db.data.players = {};
				if (!this.db.data.sessions) this.db.data.sessions = {};
			}

			// Save the initialized structure
			await this.safeWrite();
		} catch (error: unknown) {
			const err = error as { code?: string; syscall?: string; path?: string };
			if (
				err &&
				err.code === "ENOENT" &&
				err.syscall === "rename" &&
				err.path &&
				err.path.includes(".sessions.json.tmp")
			) {
				// Suppress this specific error
				return;
			}
			this.logger.error("Error initializing PlayerSaver:", error);
			this.db.data = { players: {}, sessions: {} };
			try {
				await this.safeWrite();
			} catch (writeError) {
				this.logger.error("Failed to write initial data:", writeError);
			}
		}
	}

	/**
	 * Clean up node sessions that don't exist in the provided node IDs
	 * @param validNodeIds Array of valid node IDs from nodes.ts
	 */
	async cleanupNodeSessions(validNodeIds: string[]): Promise<void> {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Ensure sessions object exists
			if (!this.db.data || !this.db.data.sessions) {
				return;
			}

			// Get current sessions
			const currentSessions = this.db.data.sessions;
			const sessionsToRemove: string[] = [];

			// Find sessions that don't exist in validNodeIds
			for (const nodeId of Object.keys(currentSessions)) {
				if (!validNodeIds.includes(nodeId)) {
					sessionsToRemove.push(nodeId);
				}
			}

			// Remove invalid sessions
			if (sessionsToRemove.length > 0) {
				this.logger.info(
					`Removing ${sessionsToRemove.length} invalid node sessions: ${sessionsToRemove.join(", ")}`,
				);

				for (const nodeId of sessionsToRemove) {
					delete this.db.data.sessions[nodeId];
				}

				// Write changes
				await this.safeWrite();
				this.logger.info("Successfully cleaned up invalid node sessions");
			}
		} catch (error) {
			this.logger.error("Error cleaning up node sessions:", error);
		}
	}

	/**
	 * Safely extract necessary data from player object to avoid circular references
	 */
	public extractSafePlayerData(
		playerData: Record<string, unknown>,
	): PlayerData {
		// Default minimal data
		const defaultData: PlayerData = {
			guildId: (playerData.guildId as string) || "",
			voiceChannelId: (playerData.voiceChannelId as string) || "",
			textChannelId: (playerData.textChannelId as string) || "",
		};

		try {
			const options = (playerData.options as Record<string, unknown>) || {};

			let queueData: PlayerData["queue"] = undefined;
			try {
				const queueObject = playerData.queue as Record<string, unknown>;
				if (queueObject && Array.isArray(queueObject.tracks)) {
					queueData = queueObject.tracks.map((track) => {
						if (typeof track === "string") return { encoded: track };
						const trackObj = track as Record<string, unknown>;
						let safeRequester = null;
						if (trackObj.requester) {
							try {
								const requesterObj = trackObj.requester as Record<
									string,
									unknown
								>;
								if (typeof requesterObj === "object" && requesterObj !== null) {
									if (requesterObj.id) {
										safeRequester = { id: requesterObj.id };
									}
								} else if (typeof requesterObj === "string") {
									safeRequester = requesterObj;
								}
							} catch (e) {
								this.logger.error("Error processing requester:", e);
							}
						}
						const info = trackObj.info as Record<string, unknown>;
						return {
							encoded: trackObj.encoded as string,
							info: {
								title: info?.title as string,
								uri: info?.uri as string,
								author: info?.author as string,
								duration: info?.duration as number,
								identifier: info?.identifier as string,
								isStream: info?.isStream as boolean,
								isSeekable: info?.isSeekable as boolean,
								sourceName: info?.sourceName as string,
								thumbnail:
									(info?.thumbnail as string) || (info?.artworkUrl as string),
								artworkUrl:
									(info?.artworkUrl as string) || (info?.thumbnail as string),
							},
							requester: safeRequester,
						};
					});
				}
			} catch (error) {
				this.logger.error("Error extracting queue data:", error);
			}

			let safeRequester = null;
			let trackInfo: Record<string, unknown> | undefined;
			if (playerData.track && typeof playerData.track === "object") {
				const trackObj = playerData.track as Record<string, unknown>;
				if (trackObj.requester) {
					try {
						const requesterObj = trackObj.requester as Record<string, unknown>;
						if (typeof requesterObj === "object" && requesterObj !== null) {
							if (requesterObj.id) {
								safeRequester = { id: requesterObj.id };
							}
						} else if (typeof requesterObj === "string") {
							safeRequester = requesterObj;
						}
					} catch (e) {
						this.logger.error("Error processing track requester:", e);
					}
				}
				trackInfo = trackObj.info as Record<string, unknown>;
			}

			return {
				guildId: playerData.guildId as string,
				voiceChannelId: playerData.voiceChannelId as string,
				textChannelId: playerData.textChannelId as string,
				nodeId: playerData.nodeId as string,
				nodeSessionId: playerData.nodeSessionId as string,
				volume: playerData.volume as number,
				options: {
					selfDeaf: options.selfDeaf as boolean,
					selfMute: options.selfMute as boolean,
					applyVolumeAsFilter: options.applyVolumeAsFilter as boolean,
					instaUpdateFiltersFix: options.instaUpdateFiltersFix as boolean,
					vcRegion: options.vcRegion as string,
				},
				repeatMode:
					(playerData.repeatMode as "off" | "track" | "queue") ?? "off", // <-- simpan repeatMode
				track: playerData.track
					? {
							encoded:
								typeof playerData.track === "string"
									? playerData.track
									: ((playerData.track as Record<string, unknown>)
											.encoded as string),
							info: trackInfo
								? {
										title: trackInfo.title as string,
										uri: trackInfo.uri as string,
										length: trackInfo.length as number,
										thumbnail:
											(trackInfo.thumbnail as string) ||
											(trackInfo.artworkUrl as string),
										artworkUrl:
											(trackInfo.artworkUrl as string) ||
											(trackInfo.thumbnail as string),
									}
								: undefined,
							requester: safeRequester,
						}
					: undefined,
				queue: queueData,
			};
		} catch (error) {
			this.logger.error("Error extracting safe player data:", error);
			// Return minimal data if extraction fails
			return defaultData;
		}
	}

	/**
	 * Save player data to the database
	 */
	async savePlayer(guildId: string, playerData: PlayerData) {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Make sure players object exists
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			}

			if (!this.db.data.players) {
				this.db.data.players = {};
			}

			// Save player data
			this.db.data.players[guildId] = playerData;

			// Write changes
			await this.safeWrite();
		} catch (error) {
			this.logger.error(
				`Error saving player data for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Save node session ID to the database
	 */
	async saveNodeSession(nodeId: string, sessionId: string) {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Make sure sessions object exists
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			}

			if (!this.db.data.sessions) {
				this.db.data.sessions = {};
			}

			// Save session ID
			this.db.data.sessions[nodeId] = sessionId;

			// Write changes
			await this.safeWrite();
		} catch (error) {
			this.logger.error(`Error saving session ID for node ${nodeId}:`, error);
		}
	}

	/**
	 * Get all saved node sessions
	 */
	async getAllNodeSessions(): Promise<Map<string, string>> {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Ensure sessions object exists
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			}

			if (!this.db.data.sessions) {
				this.db.data.sessions = {};
				await this.safeWrite();
				return new Map();
			}

			// Convert to Map
			const sessionMap = new Map<string, string>();
			for (const [nodeId, sessionId] of Object.entries(this.db.data.sessions)) {
				sessionMap.set(nodeId, sessionId);
			}

			return sessionMap;
		} catch (error) {
			this.logger.error("Error getting node sessions:", error);
			return new Map();
		}
	}

	/**
	 * Get player data for a specific guild
	 */
	async getPlayer(guildId: string): Promise<PlayerData | null> {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

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
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Check if data structure exists
			if (!this.db.data || !this.db.data.players) {
				return;
			}

			// Delete player data
			delete this.db.data.players[guildId];

			// Write changes
			await this.safeWrite();
		} catch (error) {
			this.logger.error(
				`Error deleting player data for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Get a session ID for a specific node
	 */
	async getNodeSession(nodeId: string): Promise<string | null> {
		// Ensure database is ready
		await this.waitForReady();

		try {
			// Ensure data is loaded
			await this.db.read();

			// Ensure sessions object exists
			if (!this.db.data || !this.db.data.sessions) {
				return null;
			}

			// Return session ID if it exists
			return this.db.data.sessions[nodeId] || null;
		} catch (error) {
			this.logger.error(`Error getting session ID for node ${nodeId}:`, error);
			return null;
		}
	}

	/**
	 * Update queue tracks for a guild in the database
	 */
	async updatePlayerQueue(
		guildId: string,
		queueTracks: Array<{
			encoded?: string;
			info?: {
				title?: string;
				uri?: string;
				author?: string;
				length?: number;
				identifier?: string;
				isStream?: boolean;
				isSeekable?: boolean;
				sourceName?: string;
				thumbnail?: string;
			};
			requester?: string | { id: unknown } | null;
		}>,
	) {
		await this.waitForReady();
		try {
			await this.db.read();
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			}
			if (!this.db.data.players[guildId]) {
				this.db.data.players[guildId] = { guildId };
			}
			this.db.data.players[guildId].queue = queueTracks;
			await this.safeWrite();
			this.logger.info(`Updated queue for guild ${guildId} in sessions.json`);
		} catch (error) {
			this.logger.error(`Error updating queue for guild ${guildId}:`, error);
		}
	}

	/**
	 * Get the last sent messageId and channelId for a guild from the database
	 */
	public async getLastNowPlayingMessage(
		guildId: string,
	): Promise<{ messageId?: string; channelId?: string } | null> {
		await this.waitForReady();
		try {
			await this.db.read();
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
	public async setLastNowPlayingMessage(
		guildId: string,
		messageId: string,
		channelId: string,
	) {
		await this.waitForReady();
		try {
			await this.db.read();
			if (!this.db.data) this.db.data = { players: {}, sessions: {} };
			if (!this.db.data.players[guildId])
				this.db.data.players[guildId] = { guildId };
			this.db.data.players[guildId].messageId = messageId;
			this.db.data.players[guildId].textChannelId = channelId;
			await this.safeWrite();
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
	public async clearLastNowPlayingMessage(guildId: string) {
		await this.waitForReady();
		try {
			await this.db.read();
			if (!this.db.data || !this.db.data.players[guildId]) return;
			this.db.data.players[guildId].messageId = undefined;
			await this.safeWrite();
		} catch (error) {
			this.logger.error(
				`Error clearing last now playing message for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Helper to safely write to the DB and suppress ENOENT error for .sessions.json.tmp rename
	 */
	private async safeWrite() {
		try {
			await this.db.write();
		} catch (error) {
			const err = error as { code?: string; syscall?: string; path?: string };
			if (
				err &&
				err.code === "ENOENT" &&
				err.syscall === "rename" &&
				err.path &&
				err.path.includes(".sessions.json.tmp")
			) {
				// Suppress this specific error
				return;
			}
			throw error;
		}
	}
}
