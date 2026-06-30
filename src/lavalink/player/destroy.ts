import type { Player } from "lavalink-client";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, PlayerSaver } from "#soundy/utils";

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

		const playerSaver = new PlayerSaver(client.logger);
		let messageId = player.getData("messageId");
		let channelId = "";
		const rawChannel = player.textChannelId;
		if (
			typeof rawChannel === "object" &&
			rawChannel !== null &&
			Object.hasOwn(rawChannel, "id") &&
			typeof (rawChannel as { id: unknown }).id === "string"
		) {
			channelId = (rawChannel as { id: string }).id;
		} else if (typeof rawChannel === "string") {
			channelId = rawChannel;
		}

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
				player.deleteData("messageId");
				await playerSaver.clearLastNowPlayingMessage(player.guildId);
			} catch {
				// Silently fail if message deletion fails
			}
		}

		try {
			await playerSaver.delPlayer(player.guildId);
			client.logger.info(`[Music] Deleted player for guild ${player.guildId}`);
		} catch (err) {
			client.logger.error(
				`[Music] Failed to delete player for guild ${player.guildId}:`,
				err,
			);
		}

		const lyricsId = player.getData<string | undefined>("lyricsId");
		const lyricsEnabled = player.getData<boolean | undefined>("lyricsEnabled");

		if (lyricsEnabled) {
			try {
				await player.unsubscribeLyrics();
				client.logger.info(
					`[Music] Unsubscribed from lyrics for guild ${player.guildId}`,
				);
			} catch (error) {
				client.logger.error(
					`[Music] Failed to unsubscribe from lyrics for guild ${player.guildId}:`,
					error,
				);
			}
		}

		if (lyricsId && player.textChannelId) {
			try {
				await client.messages.delete(lyricsId, player.textChannelId);
				client.logger.info(
					`[Music] Deleted lyrics message for guild ${player.guildId}`,
				);
			} catch (error) {
				client.logger.error(
					`[Music] Failed to delete lyrics message for guild ${player.guildId}:`,
					error,
				);
			}
		}

		player.setData("lyricsEnabled", false);
		player.deleteData("lyrics");
		player.deleteData("lyricsId");
		player.deleteData("lyricsRequester");

		await playerSaver.clearLyricsData(player.guildId);
	},
});
