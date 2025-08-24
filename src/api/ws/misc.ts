import type { WSHandler } from "./types";

export const handleUserConnect: WSHandler = async (ws, msg, _client) => {
	if (msg.type === "user-connect" && msg.userId) {
		if (!ws.store) ws.store = {};

		ws.store.userId = String(msg.userId);
		ws.store.guildId = msg.guildId;
		ws.store.voiceChannelId = msg.voiceChannelId
			? String(msg.voiceChannelId)
			: undefined;

		ws.send(
			JSON.stringify({
				type: "user-connect",
				success: true,
				message: "User connected successfully",
				userId: msg.userId,
			}),
		);
		return;
	}
};

export const handleGetPlaylist: WSHandler = async (ws, msg, client) => {
	if (msg.type === "get-playlist" && msg.playlistId) {
		const playlistId = String(msg.playlistId);

		try {
			const playlist = await client.database.getPlaylistById(playlistId);

			if (!playlist) {
				ws.send(
					JSON.stringify({
						type: "get-playlist",
						success: false,
						message: "Playlist not found",
					}),
				);
				return;
			}

			const tracks = playlist.tracks.map((track, index) => ({
				id: track.id,
				index,
				url: track.url,
				info: track.info ? JSON.parse(track.info) : null,
			}));

			ws.send(
				JSON.stringify({
					type: "get-playlist",
					success: true,
					playlist: {
						id: playlist.id,
						name: playlist.name,
						userId: playlist.userId,
						trackCount: tracks.length,
						tracks: tracks,
						createdAt: playlist.createdAt,
					},
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "get-playlist",
					success: false,
					message: `Error getting playlist: ${String(error)}`,
				}),
			);
		}
		return;
	}
};

export const handleGetPlaylists: WSHandler = async (ws, msg, client) => {
	if (msg.type === "get-playlists" && msg.userId) {
		const userId = String(msg.userId);

		try {
			const playlists = await client.database.getPlaylists(userId);

			ws.send(
				JSON.stringify({
					type: "get-playlists",
					success: true,
					playlists: playlists.map((playlist) => ({
						id: playlist.id,
						name: playlist.name,
						trackCount: playlist.tracks.length,
						createdAt: playlist.createdAt,
					})),
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "get-playlists",
					success: false,
					message: `Error getting playlists: ${String(error)}`,
				}),
			);
		}
		return;
	}
};
