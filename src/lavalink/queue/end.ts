import { LavalinkEventTypes } from "#soundy/types";
import {
	createLavalinkEvent,
	createNullEmbed,
	PlayerSaver,
} from "#soundy/utils";

export default createLavalinkEvent({
	name: "queueEnd",
	type: LavalinkEventTypes.Manager,
	async run(client, player) {
		if (!player.textChannelId || !player.voiceChannelId) return;

		const voice = await client.channels.fetch(player.voiceChannelId);
		if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

		if (voice.is(["GuildVoice"])) {
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

		const setupData = await client.database.getSetup(player.guildId);
		if (setupData?.messageId && setupData.channelId) {
			try {
				const setupMessage = await client.messages.fetch(
					setupData.messageId,
					setupData.channelId,
				);
				if (setupMessage) {
					await client.messages.edit(
						setupMessage.id,
						setupData.channelId,
						await createNullEmbed(client, player.guildId),
					);
				}
			} catch (error) {
				client.logger.debug(`[Music] Failed to update setup message: ${error}`);
			}
		}

		if (
			setupData?.messageId &&
			setupData?.channelId &&
			messageId === setupData.messageId &&
			channelId === setupData.channelId
		) {
		} else if (messageId && channelId) {
			try {
				await client.messages.delete(messageId as string, channelId);
				player.deleteData("messageId");
				await playerSaver.clearLastNowPlayingMessage(player.guildId);
			} catch {}
		}

		const playerData = player.toJSON();
		const safeData = playerSaver.extractSafePlayerData(
			playerData as unknown as Record<string, unknown>,
		);
		await playerSaver.savePlayer(player.guildId, safeData);

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

		const mode247 = await client.database.get247Mode(player.guildId);
		if (!mode247?.enabled) {
			const disconnectTimeout = setTimeout(async () => {
				const currentPlayer = client.manager.getPlayer(player.guildId);
				if (currentPlayer && !currentPlayer.queue.current) {
					await currentPlayer.destroy();
				}
			}, 60000);
			player.setData("disconnectTimeout", disconnectTimeout);
		} else {
			const existingTimeout =
				player.getData<NodeJS.Timeout>("disconnectTimeout");
			if (existingTimeout) {
				clearTimeout(existingTimeout);
				player.deleteData("disconnectTimeout");
			}
		}
	},
});
