import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";
import type { Player } from "lavalink-client";

export default createLavalinkEvent({
	name: "playerDestroy",
	type: LavalinkEventTypes.Manager,
	async run(client, player: Player) {
		const voice = await client.channels.fetch(
			player.voiceChannelId ?? player.options.voiceChannelId,
		);
		if (voice?.is(["GuildVoice"])) {
			// Check if voice status is enabled for this guild
			const voiceStatusEnabled = await client.database.getVoiceStatus(
				player.guildId,
			);
			if (voiceStatusEnabled) {
				await voice.setVoiceStatus(null).catch(() => null);
			}
		}

		// Hapus nowPlaying message jika ada
		const playerSaver = new PlayerSaver(client.logger);
		let messageId = player.get("messageId");
		let channelId = "";
		const rawChannel = player.textChannelId;
		if (
			typeof rawChannel === "object" &&
			rawChannel !== null &&
			Object.prototype.hasOwnProperty.call(rawChannel, "id") &&
			typeof (rawChannel as { id: unknown }).id === "string"
		) {
			channelId = (rawChannel as { id: string }).id;
		} else if (typeof rawChannel === "string") {
			channelId = rawChannel;
		}
		// Ambil dari database jika tidak ada di player
		if (!messageId || !channelId) {
			const lastMsg = await playerSaver.getLastNowPlayingMessage(
				player.guildId,
			);
			if (lastMsg) {
				messageId = lastMsg.messageId;
				channelId = lastMsg.channelId || channelId;
			}
		}
		if (messageId && channelId) {
			try {
				await client.messages.delete(messageId as string, channelId);
				player.set("messageId", undefined);
				await playerSaver.clearLastNowPlayingMessage(player.guildId);
			} catch {
				// Silently fail if message deletion fails
			}
		}

		// Hapus data player
		try {
			await playerSaver.delPlayer(player.guildId);
			client.logger.info(`[Music] Deleted player for guild ${player.guildId}`);
		} catch (err) {
			client.logger.error(
				`[Music] Failed to delete player for guild ${player.guildId}:`,
				err,
			);
		}
	},
});
