import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog, getDepth } from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackError",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track, payload) {
		// Log the error to console
		client.logger.error(
			`[Music] Track error for "${track?.info.title}" in guild ${player.guildId}. Error: ${getDepth(payload.exception)}`,
		);

		try {
			// Skip reporting rate limit errors as these are generally less critical
			if (
				payload.exception?.message.includes("rate limit") ||
				payload.exception?.message.includes("429")
			) {
				client.logger.warn(
					`[Music] Skipping webhook for rate limit error on track "${track?.info.title}"`,
				);
				return;
			}

			// Send to webhook
			await sendNodeLog(client, "track-error", player.node, {
				exception: payload.exception,
				track: track,
				// biome-ignore lint/suspicious/noExplicitAny: Lavalink event payload types are dynamic and may not match strict typings, so 'any' is used for compatibility.
			} as any);

			// If the track has a text channel, send an error message
			if (player.textChannelId) {
				await client.messages
					.write(player.textChannelId, {
						embeds: [
							{
								color: client.config.color.no,
								title: "❌ Track Error",
								description: `There was an error playing **${track?.info.title}**.`,
								fields: [
									{
										name: "Error",
										value: `\`${payload.exception?.message || "Unknown error"}\``,
									},
								],
							},
						],
					})
					.catch(() => null); // Silently fail if message can't be sent
			}
		} catch (error) {
			client.logger.error(
				`[Music] Failed to handle track error event: ${error}`,
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
			client.logger.error(
				`[Music] Failed to skip to next track after error: ${skipError}`,
			);
		}
	},
});
