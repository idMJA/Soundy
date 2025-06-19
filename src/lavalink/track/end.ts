// filepath: e:/Projects/Soundy v3.3.5/src/lavalink/trackEndEvent.ts
import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackEnd",
	type: LavalinkEventTypes.Manager,
	async run(client, player) {
		if (!player.textChannelId) return;

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
		// Cek jika messageId adalah setup message, jangan hapus
		const setupData = await client.database.getSetup(player.guildId);
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
	},
});
