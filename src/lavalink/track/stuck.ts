import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog } from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackStuck",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track, payload) {
		// Log the error to console
		client.logger.error(
			`[Music] Track stuck: "${track?.info.title}" in guild ${player.guildId}. Threshold: ${payload.thresholdMs}ms`,
		);

		try {
			// Create a custom exception for webhook
			const exception = {
				message: `Track stuck for ${payload.thresholdMs}ms`,
				name: "TrackStuckException",
				severity: "COMMON",
				cause: null,
			};

			// Send to webhook
			await sendNodeLog(client, "track-error", player.node, {
				track,
				exception,
				guildId: player.guildId,
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} as any);

			// If the track has a text channel, send a message
			if (player.textChannelId) {
				await client.messages
					.write(player.textChannelId, {
						embeds: [
							{
								color: client.config.color.no,
								title: "❌ Track Stuck",
								description: `The track **${track?.info.title}** got stuck and couldn't continue playing. Skipping to the next track.`,
							},
						],
					})
					.catch(() => null); // Silently fail if message can't be sent
			}
		} catch (error) {
			client.logger.error(
				`[Music] Failed to handle track stuck event: ${error}`,
			);
		}

		// Try to play the next track if available
		try {
			if (player.queue.tracks.length > 0) {
				await player.skip();
			} else {
				// If no more tracks, just try to stop the current one
				await player.destroy();
			}
		} catch (skipError) {
			client.logger.error(`[Music] Failed to skip stuck track: ${skipError}`);
			// In case of failure, try to destroy and recreate the player
			try {
				await player.destroy();
			} catch (destroyError) {
				client.logger.error(
					`[Music] Failed to destroy player after stuck track: ${destroyError}`,
				);
			}
		}
	},
});
