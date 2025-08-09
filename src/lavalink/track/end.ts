// filepath: e:/Projects/Soundy v3.3.5/src/lavalink/trackEndEvent.ts
import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackEnd",
	type: LavalinkEventTypes.Manager,
	async run(client, player) {
		if (!player.textChannelId) return;

		const playerSaver = new PlayerSaver(client.logger);
		let messageId = player.get("messageId");
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

		const setupData = await client.database.getSetup(player.guildId);
		if (
			setupData?.messageId &&
			setupData?.channelId &&
			messageId === setupData.messageId &&
			channelId === setupData.channelId
		) {
		} else if (messageId && channelId) {
			try {
				await client.messages.delete(messageId as string, channelId);
				player.set("messageId", undefined);
				await playerSaver.clearLastNowPlayingMessage(player.guildId);
			} catch {}
		}

		const playerData = player.toJSON();
		const safeData = playerSaver.extractSafePlayerData(
			playerData as unknown as Record<string, unknown>,
		);
		await playerSaver.savePlayer(player.guildId, safeData);

		const lyricsId = player.get<string | undefined>("lyricsId");
		const lyricsEnabled = player.get<boolean | undefined>("lyricsEnabled");

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

		player.set("lyricsEnabled", false);
		player.set("lyrics", undefined);
		player.set("lyricsId", undefined);
		player.set("lyricsRequester", undefined);

		await playerSaver.clearLyricsData(player.guildId);
	},
});
