import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type Soundy from "#soundy/client";

/**
 * Determine which track will play next according to queue state and repeatMode.
 */
function getExpectedNextTrack(
	player: Player,
): Track | UnresolvedTrack | undefined {
	if (player.repeatMode === "track") {
		return player.queue.current ?? undefined;
	}

	if (player.queue.tracks.length > 0) {
		return player.queue.tracks[0];
	}

	if (player.repeatMode === "queue") {
		return player.queue.current ?? undefined;
	}

	return undefined;
}

/**
 * Synchronize the upcoming track with NodeLink's gapless preload buffer.
 * If the guild has gapless playback enabled and there is a next track in queue,
 * this will resolve the track (if unresolved) and set nextTrack on NodeLink.
 *
 * @param client The Soundy client instance
 * @param player The Player instance
 */
export async function syncNextTrack(
	client: Soundy,
	player: Player,
): Promise<void> {
	if (!player?.node?.isNodeLink()) return;

	if (player.getData<boolean>("syncNextTrackInFlight")) {
		return;
	}
	player.setData("syncNextTrackInFlight", true);

	try {
		const isGapless = await client.database.getGapless(player.guildId);
		if (!isGapless) {
			await clearNextTrack(client, player);
			return;
		}

		// Live streams cannot transition gapless
		if (player.queue.current?.info?.isStream) {
			await clearNextTrack(client, player);
			return;
		}

		const nextTrack = getExpectedNextTrack(player);
		if (!nextTrack || nextTrack.info?.isStream) {
			await clearNextTrack(client, player);
			return;
		}

		// Proactively resolve track if it's unresolved (e.g. from Spotify or Apple Music)
		if (player.LavalinkManager.utils.isUnresolvedTrack(nextTrack)) {
			try {
				await nextTrack.resolve(player);
			} catch (err) {
				client.logger.warn(
					`[NodeLink Gapless] Failed to resolve next track "${nextTrack.info?.title}": ${err}`,
				);
				return;
			}
		}

		if (!nextTrack.encoded) {
			client.logger.warn(
				`[NodeLink Gapless] Next track "${nextTrack.info?.title}" has no encoded data after resolution.`,
			);
			return;
		}

		// Avoid redundant PATCH requests if the track is already preloaded
		const lastPreloaded = player.getData<string>("lastPreloadedTrackEncoded");
		if (lastPreloaded === nextTrack.encoded) {
			return;
		}

		await player.node.setNextTrackGapLess(player, nextTrack);
		player.setData("lastPreloadedTrackEncoded", nextTrack.encoded);

		client.logger.debug(
			`[NodeLink Gapless] Successfully preloaded next track "${nextTrack.info?.title}" for guild ${player.guildId}`,
		);
	} catch (error) {
		client.logger.warn(
			`[NodeLink Gapless] Failed to sync next track for guild ${player.guildId}: ${error}`,
		);
	} finally {
		player.deleteData("syncNextTrackInFlight");
	}
}

/**
 * Safely remove the preloaded track configuration from NodeLink.
 *
 * @param client The Soundy client instance
 * @param player The Player instance
 */
export async function clearNextTrack(
	client: Soundy,
	player: Player,
): Promise<void> {
	if (!player?.node?.isNodeLink()) return;

	try {
		const lastPreloaded = player.getData<string>("lastPreloadedTrackEncoded");
		if (!lastPreloaded) return;

		await player.node.removeNextTrackGapLess(player);
		player.deleteData("lastPreloadedTrackEncoded");

		client.logger.debug(
			`[NodeLink Gapless] Cleared next track preload for guild ${player.guildId}`,
		);
	} catch {
		// Gracefully ignore error if node disconnected or session expired
	}
}
