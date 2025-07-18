import type { Logger } from "seyfert";
import type { PlayerData } from "#soundy/types";

/**
 * Helper functions for PlayerSaver
 */
export class PlayerSaverUtils {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
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

			let queueData: PlayerData["queue"];
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
				enabledAutoplay: playerData.enabledAutoplay as boolean, // <-- simpan autoplay state
				lyricsEnabled: playerData.lyricsEnabled as boolean, // <-- simpan lyrics state
				lyricsId: playerData.lyricsId as string, // <-- simpan lyrics message ID
				lyricsRequester: playerData.lyricsRequester as string, // <-- simpan lyrics requester
				localeString: playerData.localeString as string, // <-- simpan locale string
				lyrics: playerData.lyrics
					? {
							provider: (playerData.lyrics as Record<string, unknown>)
								.provider as string,
							text: (playerData.lyrics as Record<string, unknown>)
								.text as string,
							lines: (playerData.lyrics as Record<string, unknown>)
								.lines as Array<{
								line: string;
								timestamp?: number;
							}>,
						}
					: undefined, // <-- simpan lyrics data
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
	 * Helper to safely write to the DB and suppress ENOENT error for .sessions.json.tmp rename
	 */
	public async safeWrite(writeFunction: () => Promise<void>): Promise<void> {
		try {
			await writeFunction();
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
