import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "queueEnd",
	type: LavalinkEventTypes.Manager,
	async run(client, player) {
		if (!player.textChannelId || !player.voiceChannelId) return;

		const voice = await client.channels.fetch(player.voiceChannelId);
		if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

		// Reset voice channel status if possible
		if (voice.is(["GuildVoice"])) {
			// Check if voice status is enabled for this guild
			const voiceStatusEnabled = await client.database.getVoiceStatus(
				player.guildId,
			);
			if (voiceStatusEnabled) {
				await voice.setVoiceStatus(null).catch(() => null);
			}
		}

		// Only try to delete nowplaying message if it exists
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
		// Try to update setup message to null first
		const setupData = await client.database.getSetup(player.guildId);
		if (setupData?.messageId && setupData.channelId) {
			try {
				const setupMessage = await client.messages.fetch(
					setupData.messageId,
					setupData.channelId,
				);
				if (setupMessage) {
					const { createNullEmbed } = await import("#soundy/utils");
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
		// Cek jika messageId adalah setup message, jangan hapus
		if (
			setupData?.messageId &&
			setupData?.channelId &&
			messageId === setupData.messageId &&
			channelId === setupData.channelId
		) {
			// Ini setup message, jangan dihapus
		} else if (messageId && channelId) {
			try {
				await client.messages.delete(messageId as string, channelId);
				player.set("messageId", undefined);
				await playerSaver.clearLastNowPlayingMessage(player.guildId);
			} catch {
				// Silently fail if message deletion fails
			}
		}

		// Save player state using PlayerSaver
		const playerData = player.toJSON();
		const safeData = playerSaver.extractSafePlayerData(
			playerData as unknown as Record<string, unknown>,
		);
		await playerSaver.savePlayer(player.guildId, safeData);

		// Tambahkan timeout disconnect jika bukan 24/7 mode
		const mode247 = await client.database.get247Mode(player.guildId);
		if (!mode247?.enabled) {
			const disconnectTimeout = setTimeout(async () => {
				const currentPlayer = client.manager.getPlayer(player.guildId);
				if (currentPlayer && !currentPlayer.queue.current) {
					await currentPlayer.destroy();
				}
			}, 60000); // 1 menit
			player.set("disconnectTimeout", disconnectTimeout);
		}
	},
});
