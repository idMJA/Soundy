import type { WSHandler } from "./types";
import { serializePlayerState } from "./types";

export const handleStatus: WSHandler = async (ws, msg, client) => {
	if (msg.type === "status" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			ws.send(
				JSON.stringify({ type: "status", ...serializePlayerState(player) }),
			);
		} else {
			ws.send(JSON.stringify({ type: "status", connected: false }));
		}
		return true;
	}
	return false;
};

export const handlePause: WSHandler = async (ws, msg, client) => {
	if (msg.type === "pause" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player && !player.paused) {
			await player.pause();
			ws.send(
				JSON.stringify({ type: "paused", ...serializePlayerState(player) }),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Player not found or already paused",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleResume: WSHandler = async (ws, msg, client) => {
	if (msg.type === "resume" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player?.paused) {
			await player.resume();
			ws.send(
				JSON.stringify({
					type: "resumed",
					...serializePlayerState(player),
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Player not found or not paused",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleSkip: WSHandler = async (ws, msg, client) => {
	if (msg.type === "skip" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			if (player.queue.tracks.length === 0) {
				ws.send(
					JSON.stringify({
						type: "skip",
						success: false,
						message: "No tracks in the queue to skip",
					}),
				);
				return true;
			}
			await player.skip();
			ws.send(JSON.stringify({ type: "skip", success: true }));
		} else {
			ws.send(
				JSON.stringify({
					type: "skip",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleStop: WSHandler = async (ws, msg, client) => {
	if (msg.type === "stop" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			await player.destroy();
			ws.send(JSON.stringify({ type: "stop", success: true }));
		} else {
			ws.send(
				JSON.stringify({
					type: "stop",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleSeek: WSHandler = async (ws, msg, client) => {
	if (msg.type === "seek" && msg.guildId && typeof msg.position === "number") {
		const player = client.manager.getPlayer(msg.guildId);
		if (player?.queue?.current) {
			const track = player.queue.current;
			const duration = track.info.duration || 0;
			const seekPosition = Math.max(0, Math.min(msg.position, duration));

			try {
				await player.seek(seekPosition);
				ws.send(
					JSON.stringify({
						type: "seek",
						success: true,
						position: seekPosition,
						duration: duration,
						message: `Seeked to ${Math.floor(seekPosition / 1000)}s`,
					}),
				);
			} catch (error) {
				ws.send(
					JSON.stringify({
						type: "seek",
						success: false,
						message: `Failed to seek: ${String(error)}`,
					}),
				);
			}
		} else {
			ws.send(
				JSON.stringify({
					type: "seek",
					success: false,
					message: "No active player or current track",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handlePrevious: WSHandler = async (ws, msg, client) => {
	if (msg.type === "previous" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			if (player.queue.previous.length === 0) {
				ws.send(
					JSON.stringify({
						type: "previous",
						success: false,
						message: "No previous tracks available",
					}),
				);
				return true;
			}

			try {
				const previousTrack =
					player.queue.previous[player.queue.previous.length - 1];

				if (!previousTrack) {
					ws.send(
						JSON.stringify({
							type: "previous",
							success: false,
							message: "No previous track found",
						}),
					);
					return true;
				}

				if (player.queue.current) {
					player.queue.add(player.queue.current, 0);
				}

				player.queue.previous.pop();
				player.queue.current = previousTrack;

				await player.play();

				ws.send(
					JSON.stringify({
						type: "previous",
						success: true,
						track: {
							title: previousTrack.info.title,
							author: previousTrack.info.author,
							duration: previousTrack.info.duration,
							uri: previousTrack.info.uri,
							artwork: previousTrack.info.artworkUrl,
						},
						message: "Playing previous track",
					}),
				);
			} catch (error) {
				ws.send(
					JSON.stringify({
						type: "previous",
						success: false,
						message: `Failed to play previous track: ${String(error)}`,
					}),
				);
			}
		} else {
			ws.send(
				JSON.stringify({
					type: "previous",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};
