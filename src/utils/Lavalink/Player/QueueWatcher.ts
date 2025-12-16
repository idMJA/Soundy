import type {
	QueueChangesWatcher,
	StoredQueue,
	Track,
	UnresolvedTrack,
} from "lavalink-client";
import type { Logger } from "seyfert";
import type Soundy from "#soundy/client";
import { PlayerSaver } from "./Saver";

/**
 * Custom Queue Watcher that saves queue changes to sessions.json
 * This ensures queue persistence across bot restarts
 */
export class SoundyQueueWatcher implements QueueChangesWatcher {
	private client: Soundy;
	private logger: Logger;
	private playerSaver: PlayerSaver;

	constructor(client: Soundy) {
		this.client = client;
		this.logger = client.logger;
		this.playerSaver = new PlayerSaver(this.logger);
	}

	/**
	 * Convert track data to a safe format for persistence
	 */
	private convertTrackForSaving(track: Track | UnresolvedTrack) {
		// Properly handle requester data
		let safeRequester = null;
		if (track.requester) {
			if (typeof track.requester === "object" && track.requester !== null) {
				// Extract only essential user data for persistence
				const requesterObj = track.requester as Record<string, unknown>;
				safeRequester = {
					id: requesterObj.id || null,
					username: requesterObj.username || requesterObj.tag || null,
					displayName: requesterObj.displayName || null,
					tag: requesterObj.tag || null,
				};
			} else if (typeof track.requester === "string") {
				safeRequester = track.requester;
			}
		}

		return {
			encoded: track.encoded || undefined,
			info: {
				title: track.info?.title,
				uri: track.info?.uri,
				author: track.info?.author,
				length: track.info?.duration,
				identifier: track.info?.identifier,
				isStream: track.info?.isStream,
				isSeekable: track.info?.isSeekable,
				sourceName: track.info?.sourceName,
				artworkUrl: track.info?.artworkUrl,
			},
			requester: safeRequester,
		};
	}

	/**
	 * Get player data from the lavalink player and convert to safe format
	 */
	private async getSafePlayerData(guildId: string) {
		const player = this.client.manager.getPlayer(guildId);
		if (!player) return null;

		const playerData = {
			guildId: player.guildId,
			voiceChannelId: player.voiceChannelId || undefined,
			textChannelId: player.textChannelId || undefined,
			nodeId: player.node?.options?.id || undefined,
			nodeSessionId: player.node?.sessionId || undefined,
			volume: player.volume || 100,
			options: {
				selfDeaf: player.options?.selfDeaf,
				selfMute: player.options?.selfMute,
				applyVolumeAsFilter: player.options?.applyVolumeAsFilter,
				instaUpdateFiltersFix: player.options?.instaUpdateFiltersFix,
				vcRegion: player.options?.vcRegion,
			},
			repeatMode: player.repeatMode || "off",
			enabledAutoplay: player.get("enabledAutoplay") || false,
			track: player.queue.current
				? this.convertTrackForSaving(player.queue.current)
				: undefined,
			queue: player.queue.tracks.map((track) =>
				this.convertTrackForSaving(track),
			),
		};

		return this.playerSaver.extractSafePlayerData(playerData);
	}

	/**
	 * Save player data after any queue change
	 */
	private async savePlayerData(guildId: string) {
		try {
			const player = this.client.manager.getPlayer(guildId);
			if (!player) {
				this.logger.debug(
					`[QueueWatcher] No player found for guild ${guildId}`,
				);
				return;
			}

			// Log raw queue state before conversion
			// this.logger.debug(
			// 	`[QueueWatcher] Raw queue state - Current: ${player.queue.current?.info?.title || "None"}, Queue tracks: ${player.queue.tracks.length}, Track names: [${player.queue.tracks.map((t) => t.info?.title || "Unknown").join(", ")}]`,
			// );

			const playerData = await this.getSafePlayerData(guildId);
			if (playerData) {
				// Debug logging to see what's being saved
				// const currentTrackTitle =
				// 	typeof playerData.track === "object" && playerData.track?.info?.title
				// 		? playerData.track.info.title
				// 		: "None";
				// const queueTitlesArr = Array.isArray(playerData.queue)
				// 	? playerData.queue
				// 			.slice(0, 5)
				// 			.map((t) =>
				// 				typeof t === "object" && t.info?.title
				// 					? t.info.title
				// 					: "Unknown",
				// 			)
				// 	: [];
				// const queueTracks =
				// 	queueTitlesArr.length > 0 ? queueTitlesArr.join(", ") : "No tracks";
				// this.logger.debug(
				// 	`[QueueWatcher] Saving player data for guild ${guildId}:`,
				// 	{
				// 		currentTrack: currentTrackTitle,
				// 		queueLength: Array.isArray(playerData.queue)
				// 			? playerData.queue.length
				// 			: 0,
				// 		first5Tracks: queueTracks,
				// 	},
				// );

				await this.playerSaver.savePlayer(guildId, playerData);
				this.logger.debug(
					`[QueueWatcher] Saved player data for guild ${guildId}`,
				);
			}
		} catch (error) {
			this.logger.error(
				`[QueueWatcher] Failed to save player data for guild ${guildId}:`,
				error,
			);
		}
	}

	/**
	 * Called when queue is shuffled
	 */
	shuffled(
		guildId: string,
		_oldStoredQueue: StoredQueue,
		_newStoredQueue: StoredQueue,
	): void {
		const guildName = this.client.cache.guilds?.get(guildId)?.name || guildId;
		this.logger.debug(`[QueueWatcher] ${guildName}: Queue got shuffled`);

		// Save queue state after shuffle
		this.savePlayerData(guildId).catch((error) => {
			this.logger.error(
				`[QueueWatcher] Failed to save queue after shuffle for guild ${guildId}:`,
				error,
			);
		});
	}

	/**
	 * Called when tracks are added to queue
	 */
	tracksAdd(
		guildId: string,
		tracks: (Track | UnresolvedTrack)[],
		position: number,
		_oldStoredQueue: StoredQueue,
		_newStoredQueue: StoredQueue,
	): void {
		const guildName = this.client.cache.guilds?.get(guildId)?.name || guildId;
		const first5Titles = tracks
			.slice(0, 5)
			.map((t) => t.info?.title || "Unknown")
			.join(", ");
		this.logger.debug(
			`[QueueWatcher] ${guildName}: ${tracks.length} track(s) added to queue at position #${position}. First 5: ${first5Titles}`,
		);

		// Add debug info about the queue state
		// const player = this.client.manager.getPlayer(guildId);
		// if (player) {
		// 	this.logger.debug(
		// 		`[QueueWatcher] Queue state - Current: ${player.queue.current?.info?.title || "None"}, Queue length: ${player.queue.tracks.length}, Total tracks: ${player.queue.tracks.length + (player.queue.current ? 1 : 0)}`,
		// 	);

		// Log raw queue structure for debugging PlayerSaver
		// 	this.logger.debug(
		// 		`[QueueWatcher] Raw queue state - Current: ${player.queue.current?.info?.title || "None"}, Queue tracks: ${player.queue.tracks.length}, Track names: [${player.queue.tracks
		// 			.slice(0, 5)
		// 			.map((t) => t.info?.title)
		// 			.join(", ")}]`,
		// 	);
		// }

		// Save queue state after adding tracks with a small delay to account for any async operations
		setTimeout(() => {
			this.savePlayerData(guildId).catch((error) => {
				this.logger.error(
					`[QueueWatcher] Failed to save queue after adding tracks for guild ${guildId}:`,
					error,
				);
			});
		}, 100);
	}

	/**
	 * Called when tracks are removed from queue
	 */
	tracksRemoved(
		guildId: string,
		tracks: (Track | UnresolvedTrack)[],
		position: number | number[],
		_oldStoredQueue: StoredQueue,
		_newStoredQueue: StoredQueue,
	): void {
		const guildName = this.client.cache.guilds?.get(guildId)?.name || guildId;
		const positionStr = Array.isArray(position)
			? position.join(", ")
			: position.toString();
		this.logger.debug(
			`[QueueWatcher] ${guildName}: ${tracks.length} track(s) removed from queue at position(s) #${positionStr}`,
		);

		// Save queue state after removing tracks
		this.savePlayerData(guildId).catch((error) => {
			this.logger.error(
				`[QueueWatcher] Failed to save queue after removing tracks for guild ${guildId}:`,
				error,
			);
		});
	}
}
