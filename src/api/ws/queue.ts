import type { WSHandler } from "./types";

export const handleQueue: WSHandler = async (ws, msg, client) => {
	if (msg.type === "queue" && msg.guildId) {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const queue = player.queue.tracks.slice(0, 50).map((track, index) => ({
				position: index + 1,
				title: track.info.title,
				author: track.info.author,
				duration: track.info.duration,
				uri: track.info.uri,
				artwork: track.info.artworkUrl,
			}));

			ws.send(
				JSON.stringify({
					type: "queue",
					queue: queue,
					total: player.queue.tracks.length,
					current: player.queue.current
						? {
								title: player.queue.current.info.title,
								author: player.queue.current.info.author,
								duration: player.queue.current.info.duration,
								uri: player.queue.current.info.uri,
								artwork: player.queue.current.info.artworkUrl,
								position: player.position,
							}
						: null,
				}),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "queue",
					queue: [],
					total: 0,
					current: null,
				}),
			);
		}
		return;
	}
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
		return;
	}
};

export const handleRemove: WSHandler = async (ws, msg, client) => {
	if (msg.type === "remove" && msg.guildId && typeof msg.index === "number") {
		const player = client.manager.getPlayer(msg.guildId);
		if (player) {
			const index = msg.index - 1;
			if (index >= 0 && index < player.queue.tracks.length) {
				const removedTrack = player.queue.tracks.splice(index, 1)[0];
				ws.send(
					JSON.stringify({
						type: "remove",
						success: true,
						message: `Removed "${removedTrack?.info.title}" from queue`,
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
		return;
	}
};

export const handlePlay: WSHandler = async (ws, msg, client) => {
	if (msg.type === "play" && msg.guildId && msg.query) {
		const player = client.manager.getPlayer(msg.guildId);
		if (!player) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: "No active player - join a voice channel first",
				}),
			);
			return;
		}

		try {
			const result = await client.manager.search(String(msg.query));

			if (!result?.tracks?.length) {
				ws.send(
					JSON.stringify({
						type: "play",
						success: false,
						message: "No tracks found for your query",
					}),
				);
				return;
			}

			const track = result.tracks[0];
			if (!track) {
				ws.send(
					JSON.stringify({
						type: "play",
						success: false,
						message: "No track found",
					}),
				);
				return;
			}

			player.queue.add(track);

			if (!player.playing && !player.paused) {
				await player.play();
			}

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
					message: player.playing
						? `Added "${track.info.title}" to queue`
						: `Now playing "${track.info.title}"`,
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "play",
					success: false,
					message: `Failed to play track: ${String(error)}`,
				}),
			);
		}
		return;
	}
};
