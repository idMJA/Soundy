import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "playerUpdate",
	type: LavalinkEventTypes.Manager,
	async run(client, oldPlayer, newPlayer) {
		const newPlayerData = newPlayer.toJSON();

		client.logger.debug(
			`[Music] Updating player for guild ${newPlayer.guildId}`,
		);

		if (
			!oldPlayer ||
			oldPlayer.voiceChannelId !== newPlayerData.voiceChannelId ||
			oldPlayer.textChannelId !== newPlayerData.textChannelId ||
			oldPlayer.options.selfDeaf !== newPlayerData.options.selfDeaf ||
			oldPlayer.options.selfMute !== newPlayerData.options.selfMute ||
			oldPlayer.nodeId !== newPlayerData.nodeId ||
			oldPlayer.nodeSessionId !== newPlayerData.nodeSessionId ||
			oldPlayer.options.applyVolumeAsFilter !==
				newPlayerData.options.applyVolumeAsFilter ||
			oldPlayer.options.instaUpdateFiltersFix !==
				newPlayerData.options.instaUpdateFiltersFix ||
			oldPlayer.options.vcRegion !== newPlayerData.options.vcRegion
		) {
			const playerSaver = new PlayerSaver(client.logger);
			const safeData = playerSaver.extractSafePlayerData(
				newPlayerData as unknown as Record<string, unknown>,
			);
			await playerSaver.savePlayer(newPlayer.guildId, safeData);
		}
	},
});
