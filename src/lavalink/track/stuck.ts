import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog } from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackStuck",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track, payload) {
		client.logger.error(
			`[Music] Track stuck: "${track?.info.title}" in guild ${player.guildId}. Threshold: ${payload.thresholdMs}ms`,
		);

		try {
			const exception = {
				message: `Track stuck for ${payload.thresholdMs}ms`,
				name: "TrackStuckException",
				severity: "COMMON",
				cause: null,
			};

			await sendNodeLog(client, "track-error", player.node, {
				track,
				exception,
				guildId: player.guildId,
				// biome-ignore lint/suspicious/noExplicitAny: Lavalink event payload types are dynamic and may not match strict typings, so 'any' is used for compatibility.
			} as any);

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
					.catch(() => null);
			}
		} catch (error) {
			client.logger.error(
				`[Music] Failed to handle track stuck event: ${error}`,
			);
		}

		try {
			if (player.queue.tracks.length > 0) {
				await player.skip();
			} else {
				await player.destroy();
			}
		} catch (skipError) {
			client.logger.error(`[Music] Failed to skip stuck track: ${skipError}`);

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
