import type { WSHandler } from "./types";
import { getContext, getRequesterId } from "./types";

export const handleQueue: WSHandler = async (ws, msg, client) => {
	if (msg.type === "queue" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const queue = player.queue.tracks.map((track, index: number) => ({
				index,
				title: track.info.title || "Unknown",
				author: track.info.author || "Unknown",
				duration: track.info.duration || 0,
				uri: track.info.uri || "",
				artwork: track.info.artworkUrl || undefined,
				requester:
					track.requester &&
					typeof track.requester === "object" &&
					"id" in track.requester
						? (track.requester as { id: string }).id
						: undefined,
			}));
			ws.send(JSON.stringify({ type: "queue", queue, length: queue.length }));
		} else {
			ws.send(JSON.stringify({ type: "queue", queue: [], length: 0 }));
		}
		return true;
	}
	return false;
};

export const handleClear: WSHandler = async (ws, msg, client) => {
	if (msg.type === "clear" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			while (player.queue.tracks.length > 0) {
				player.queue.remove(0);
			}
			ws.send(
				JSON.stringify({
					type: "clear",
					success: true,
					message: "Queue cleared",
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "clear",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleRemove: WSHandler = async (ws, msg, client) => {
	if (msg.type === "remove" && msg.guildId && typeof msg.index === "number") {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const index = msg.index;
			if (index >= 0 && index < player.queue.tracks.length) {
				const removedTrack = player.queue.tracks[index];
				player.queue.remove(index);
				ws.send(
					JSON.stringify({
						type: "remove",
						success: true,
						message: `Removed track from position ${index + 1}`,
						removedTrack: {
							title: removedTrack?.info.title,
							author: removedTrack?.info.author,
							duration: removedTrack?.info.duration,
						},
					}),
				);
			} else {
				ws.send(
					JSON.stringify({
						type: "remove",
						success: false,
						message: "Invalid track index",
					}),
				);
			}
		} else {
			ws.send(
				JSON.stringify({
					type: "remove",
					success: false,
					message: "No active player",
				}),
			);
		}
		return true;
	}
	return false;
};

export const handlePlay: WSHandler = async (ws, msg, client) => {
	// Handle play with guildId and voiceChannelId
	if (msg.type === "play" && msg.guildId && msg.query && msg.voiceChannelId) {
		if (typeof msg.voiceChannelId !== "string" || !msg.voiceChannelId.trim()) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: "voiceChannelId harus string",
				}),
			);
			return true;
		}
		const player =
			client.manager.getPlayer(msg.guildId) ??
			client.manager.createPlayer({
				guildId: msg.guildId,
				voiceChannelId: msg.voiceChannelId,
				textChannelId: msg.voiceChannelId,
				selfDeaf: true,
				volume: client.config.defaultVolume,
			});
		if (!player.connected) {
			await player.connect();
		}
		try {
			const result = await player.search(String(msg.query), {
				requester: { id: getRequesterId(msg, ws) },
			});
			if (
				["track", "search"].includes(result.loadType) &&
				result.tracks.length
			) {
				const track = result.tracks[0];
				if (track) {
					track.requester = { id: getRequesterId(msg, ws) };
					await player.queue.add(track);
					if (!player.playing && !player.paused) await player.play();
					ws.send(
						JSON.stringify({
							type: "play",
							success: true,
							track: {
								title: track.info.title,
								author: track.info.author,
								duration: track.info.duration,
								uri: track.info.uri,
								artwork: track.info.artworkUrl,
							},
						}),
					);
				} else {
					ws.send(
						JSON.stringify({
							type: "play",
							success: false,
							message: "No track found",
						}),
					);
				}
			} else if (result.loadType === "playlist") {
				for (const track of result.tracks) {
					track.requester = { id: getRequesterId(msg, ws) };
				}
				await player.queue.add(result.tracks);
				if (!player.playing && !player.paused) await player.play();
				ws.send(
					JSON.stringify({
						type: "play",
						success: true,
						playlist: {
							name: result.playlist?.name,
							tracks: result.tracks.length,
						},
					}),
				);
			} else {
				ws.send(
					JSON.stringify({
						type: "play",
						success: false,
						message: "No results found",
					}),
				);
			}
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: `Error: ${String(error)}`,
				}),
			);
		}
		return true;
	}

	// Handle play without explicit guildId/voiceChannelId (using context)
	if (msg.type === "play" && msg.query) {
		const { guildId, voiceChannelId } = getContext(msg, ws);
		if (!guildId || !voiceChannelId) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: "guildId/voiceChannelId not set",
				}),
			);
			return true;
		}
		const requesterId = ws.store?.userId || msg.userId || "websocket-user";

		if (!ws.store) ws.store = {};
		ws.store.guildId = guildId;
		ws.store.voiceChannelId = String(voiceChannelId);
		const player =
			client.manager.getPlayer(guildId) ??
			client.manager.createPlayer({
				guildId: guildId,
				voiceChannelId: String(voiceChannelId),
				textChannelId: String(voiceChannelId),
				selfDeaf: true,
				volume: client.config.defaultVolume,
			});
		if (!player.connected) {
			await player.connect();
		}
		try {
			const result = await player.search(String(msg.query), {
				requester: { id: requesterId },
			});
			if (
				["track", "search"].includes(result.loadType) &&
				result.tracks.length
			) {
				const track = result.tracks[0];
				if (track) {
					track.requester = { id: requesterId };
					await player.queue.add(track);
					if (!player.playing && !player.paused) await player.play();
					ws.send(
						JSON.stringify({
							type: "play",
							success: true,
							track: {
								title: track.info.title,
								author: track.info.author,
								duration: track.info.duration,
								uri: track.info.uri,
								artwork: track.info.artworkUrl,
							},
						}),
					);
				} else {
					ws.send(
						JSON.stringify({
							type: "play",
							success: false,
							message: "No track found",
						}),
					);
				}
			} else if (result.loadType === "playlist") {
				for (const track of result.tracks) {
					track.requester = { id: requesterId };
				}
				await player.queue.add(result.tracks);
				if (!player.playing && !player.paused) await player.play();
				ws.send(
					JSON.stringify({
						type: "play",
						success: true,
						playlist: {
							name: result.playlist?.name,
							tracks: result.tracks.length,
						},
					}),
				);
			} else {
				ws.send(
					JSON.stringify({
						type: "play",
						success: false,
						message: "No results found",
					}),
				);
			}
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: `Error: ${String(error)}`,
				}),
			);
		}
		return true;
	}
	return false;
};
