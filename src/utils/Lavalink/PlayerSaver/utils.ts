import type { Logger } from "seyfert";
import type { PlayerData, QueueTrack } from "#soundy/types";
import type { Track } from "lavalink-client";

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
		const defaultData: PlayerData = {
			guildId: (playerData.guildId as string) || "",
			voiceChannelId: (playerData.voiceChannelId as string) || "",
			textChannelId: (playerData.textChannelId as string) || "",
		};

		try {
			const options = (playerData.options as Record<string, unknown>) || {};

			let queueData: PlayerData["queue"];
			try {
				// this.logger.debug(
				// 	`[PlayerSaver] Raw playerData.queue type: ${typeof playerData.queue}`,
				// );
				// this.logger.debug(
				// 	`[PlayerSaver] Raw playerData.queue isArray: ${Array.isArray(playerData.queue)}`,
				// );
				// this.logger.debug(
				// 	`[PlayerSaver] Raw playerData.queue length: ${Array.isArray(playerData.queue) ? playerData.queue.length : "N/A"}`,
				// );

				const tracksArray: unknown[] = [];

				// if (Array.isArray(playerData.queue)) {
				// 	this.logger.debug(
				// 		`[PlayerSaver] Processing ${playerData.queue.length} tracks directly from queue array`,
				// 	);
				// 	tracksArray = playerData.queue;
				// } else if (playerData.queue && typeof playerData.queue === "object") {
				// 	const queueObject = playerData.queue as Record<string, unknown>;
				// 	if (Array.isArray(queueObject.tracks)) {
				// 		this.logger.debug(
				// 			`[PlayerSaver] Processing ${queueObject.tracks.length} tracks from queue.tracks property`,
				// 		);
				// 		tracksArray = queueObject.tracks;
				// 	} else {
				// 		this.logger.debug(`[PlayerSaver] No tracks found in queue object`);
				// 	}
				// }

				if (tracksArray.length > 0) {
					this.logger.debug(
						`[PlayerSaver] Processing ${tracksArray.length} tracks for queue data`,
					);
					queueData = tracksArray.map((track): QueueTrack => {
						if (typeof track === "string") {
							return { encoded: track };
						}

						const trackObj = track as Track;
						let safeRequester: QueueTrack["requester"] = null;

						if (trackObj.requester) {
							try {
								if (typeof trackObj.requester === "string") {
									safeRequester = trackObj.requester;
								} else if (
									typeof trackObj.requester === "object" &&
									trackObj.requester !== null
								) {
									const requesterObj = trackObj.requester as Record<
										string,
										unknown
									>;
									if (requesterObj.id) {
										safeRequester = { id: requesterObj.id };
									}
								}
							} catch (e) {
								this.logger.error("Error processing requester:", e);
							}
						}

						return {
							encoded: trackObj.encoded,
							info: {
								title: trackObj.info?.title,
								uri: trackObj.info?.uri,
								author: trackObj.info?.author,
								duration: trackObj.info?.duration,
								identifier: trackObj.info?.identifier,
								isStream: trackObj.info?.isStream,
								isSeekable: trackObj.info?.isSeekable,
								sourceName: trackObj.info?.sourceName,
							},
							requester: safeRequester,
						};
					});
					// this.logger.debug(
					// 	`[PlayerSaver] Final queueData length: ${queueData?.length || 0}`,
					// );
					// this.logger.debug(`[PlayerSaver] Final queueData:`, queueData);
				} else {
					// this.logger.debug(
					// 	`[PlayerSaver] Queue not array - playerData.queue:`,
					// 	playerData.queue,
					// );
				}
			} catch (error) {
				this.logger.error("Error extracting queue data:", error);
			}

			let safeRequester: string | { id: unknown } | null = null;
			let trackInfo: Track["info"] | undefined;

			if (playerData.track && typeof playerData.track === "object") {
				const trackObj = playerData.track as Track;
				if (trackObj.requester) {
					try {
						if (typeof trackObj.requester === "string") {
							safeRequester = trackObj.requester;
						} else if (
							typeof trackObj.requester === "object" &&
							trackObj.requester !== null
						) {
							const requesterObj = trackObj.requester as Record<
								string,
								unknown
							>;
							if (requesterObj.id) {
								safeRequester = { id: requesterObj.id };
							}
						}
					} catch (e) {
						this.logger.error("Error processing track requester:", e);
					}
				}
				trackInfo = trackObj.info;
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
					(playerData.repeatMode as "off" | "track" | "queue") ?? "off",
				enabledAutoplay: playerData.enabledAutoplay as boolean,
				lyricsEnabled: playerData.lyricsEnabled as boolean,
				lyricsId: playerData.lyricsId as string,
				lyricsRequester: playerData.lyricsRequester as string,
				localeString: playerData.localeString as string,
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
					: undefined,
				track: playerData.track
					? {
							encoded:
								typeof playerData.track === "string"
									? playerData.track
									: ((playerData.track as Record<string, unknown>)
											.encoded as string),
							info: trackInfo
								? {
										title: trackInfo.title,
										uri: trackInfo.uri,
										duration: trackInfo.duration,
										artworkUrl: trackInfo.artworkUrl ?? undefined,
									}
								: undefined,
							requester: safeRequester,
						}
					: undefined,
				queue: queueData,
			};
		} catch (error) {
			this.logger.error("Error extracting safe player data:", error);

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
				return;
			}
			throw error;
		}
	}
}
