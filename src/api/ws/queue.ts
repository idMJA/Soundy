import { checkVoicePermissions, getContext, type WSHandler } from "./types";

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
		const perm = await checkVoicePermissions(ws, msg.guildId, client);
		if (!perm.allowed) {
			ws.send(
				JSON.stringify({
					type: "clear",
					success: false,
					message: perm.message,
				}),
			);
			return true;
		}

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
		const perm = await checkVoicePermissions(ws, msg.guildId, client);
		if (!perm.allowed) {
			ws.send(
				JSON.stringify({
					type: "remove",
					success: false,
					message: perm.message,
				}),
			);
			return true;
		}

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
	if (msg.type === "play" && msg.query) {
		const requesterId = String(
			ws.data?.userId || msg.userId || "websocket-user",
		);

		// 1. First priority: Use explicitly specified guildId (from msg or ws session selected guild)
		const context = getContext(msg, ws);
		let guildId = msg.guildId || context.guildId;
		let voiceChannelId = msg.voiceChannelId || context.voiceChannelId;

		// If user is physically in the target guild's voice channel, resolve that channel
		if (guildId && requesterId !== "websocket-user") {
			const voiceState = client.cache.voiceStates?.get(
				requesterId,
				String(guildId),
			);
			if (voiceState?.channelId) {
				voiceChannelId = voiceState.channelId;
			}
		}

		// 2. If no target guild resolved yet, search user's active voice state across all guilds
		if ((!guildId || !voiceChannelId) && requesterId !== "websocket-user") {
			const allGuilds = Array.from(client.cache.guilds?.values() ?? []);
			for (const guild of allGuilds) {
				const gId = (guild as { id: string }).id;
				const voiceState = client.cache.voiceStates?.get(requesterId, gId);
				if (voiceState?.channelId) {
					guildId = gId;
					voiceChannelId = voiceState.channelId;
					break;
				}
			}
		}

		// 3. Fail if still no channel/guild resolved
		if (!guildId || !voiceChannelId) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: "User not found in any voice channel.",
				}),
			);
			return true;
		}

		const cleanVoiceChannelId = String(voiceChannelId);
		const cleanGuildId = String(guildId);

		// 4. Update session data cache
		if (!ws.data) ws.data = {};
		ws.data.guildId = cleanGuildId;
		ws.data.voiceChannelId = cleanVoiceChannelId;
		ws.data.userId = requesterId;

		// Push user-connect update to dashboard so the client knows it moved VCs and updates its status
		ws.send(
			JSON.stringify({
				type: "user-connect",
				success: true,
				guildId: cleanGuildId,
				voiceChannelId: cleanVoiceChannelId,
				userId: requesterId,
			}),
		);

		const player =
			client.manager.getPlayer(cleanGuildId) ??
			client.manager.createPlayer({
				guildId: cleanGuildId,
				voiceChannelId: cleanVoiceChannelId,
				textChannelId: cleanVoiceChannelId,
				selfDeaf: true,
				volume: client.config.defaultVolume,
			});

		if (player.voiceChannelId !== cleanVoiceChannelId) {
			player.options.voiceChannelId = cleanVoiceChannelId;
			player.voiceChannelId = cleanVoiceChannelId;
			await player.connect();
		} else if (!player.connected) {
			await player.connect();
		}

		try {
			const result = await player.search(String(msg.query), {
				id: requesterId,
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
