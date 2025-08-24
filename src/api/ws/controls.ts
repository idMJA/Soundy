import type { WSHandler } from "./types";

export const handleVolume: WSHandler = async (ws, msg, client) => {
	if (msg.type === "volume" && msg.guildId && typeof msg.volume === "number") {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const volume = Math.max(0, Math.min(100, msg.volume));
			await player.setVolume(volume);
			ws.send(
				JSON.stringify({
					type: "volume",
					volume: volume,
					message: `Volume set to ${volume}%`,
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "volume",
					success: false,
					message: "No active player",
				}),
			);
		}
		return;
	}
};

export const handleShuffle: WSHandler = async (ws, msg, client) => {
	if (msg.type === "shuffle" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			player.queue.shuffle();
			ws.send(
				JSON.stringify({
					type: "shuffle",
					success: true,
					message: "Queue shuffled",
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
		return;
	}
};

export const handleRepeat: WSHandler = async (ws, msg, client) => {
	if (msg.type === "repeat" && msg.guildId && typeof msg.mode === "string") {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const modes = ["off", "track", "queue"] as const;
			const mode = modes.includes(msg.mode as (typeof modes)[number])
				? (msg.mode as (typeof modes)[number])
				: "off";

			if (mode === "track") {
				player.setRepeatMode("track");
			} else if (mode === "queue") {
				player.setRepeatMode("queue");
			} else {
				player.setRepeatMode("off");
			}

			ws.send(
				JSON.stringify({
					type: "repeat",
					mode: mode,
					message: `Repeat mode set to ${mode}`,
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
		return;
	}
};
