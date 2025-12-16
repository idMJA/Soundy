import type { PlayerSaver } from "#soundy/utils";
import type { WSHandler } from "./types";

export const handleVolume: WSHandler = async (ws, msg, client) => {
	if (
		msg.type === "set-volume" &&
		msg.guildId &&
		typeof msg.volume === "number"
	) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			await player.setVolume(msg.volume);
			ws.send(
				JSON.stringify({
					type: "set-volume",
					success: true,
					volume: player.volume,
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "set-volume",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleShuffle: WSHandler = async (ws, msg, client) => {
	if (msg.type === "shuffle" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			if (player.queue.tracks.length === 0) {
				ws.send(
					JSON.stringify({
						type: "shuffle",
						success: false,
						message: "No tracks in the queue to shuffle",
					}),
				);
				return true;
			}

			await player.queue.shuffle();

			ws.send(
				JSON.stringify({
					type: "shuffle",
					success: true,
					message: "Queue shuffled successfully",
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "shuffle",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleRepeat: WSHandler = async (ws, msg, client, ...args) => {
	if (msg.type === "repeat" && msg.guildId) {
		const playerSaver = args[0] as PlayerSaver | undefined;
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			let newMode: "off" | "track" | "queue";
			if (player.repeatMode === "off") newMode = "track";
			else if (player.repeatMode === "track") newMode = "queue";
			else newMode = "off";

			await player.setRepeatMode(newMode);

			if (playerSaver) {
				try {
					const playerData = player.toJSON();
					playerData.repeatMode = newMode;
					const safeData = playerSaver.extractSafePlayerData(
						playerData as unknown as Record<string, unknown>,
					);
					await playerSaver.savePlayer(player.guildId, safeData);
				} catch (e) {
					client.logger.error("Failed to save repeatMode to PlayerSaver", e);
				}
			}
			ws.send(
				JSON.stringify({
					type: "repeat",
					success: true,
					mode: newMode,
					modeNumber: newMode === "off" ? 0 : newMode === "track" ? 1 : 2,
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "repeat",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};
