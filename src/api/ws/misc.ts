import type { WSHandler } from "./types";
import type { PlayerSaver } from "#soundy/utils";

export const handleUserStatus: WSHandler = async (ws, msg, client) => {
	if (msg.type === "user-status" && msg.userId) {
		let found = null;
		for (const player of client.manager.players.values()) {
			const guildId = player.guildId;

			const userId = String(msg.userId);
			const gId = String(guildId);
			const voiceState = client.cache.voiceStates?.get(userId, gId);
			if (voiceState?.channelId) {
				found = {
					guildId,
					voiceChannelId: voiceState.channelId,
					player: player,
				};
				break;
			}
		}
		if (found) {
			ws.send(JSON.stringify({ type: "user-status", ...found }));
		} else {
			ws.send(JSON.stringify({ type: "user-status", found: false }));
		}
		return true;
	}
	return false;
};

export const handleUserConnect: WSHandler = async (
	ws,
	msg,
	client,
	...args
) => {
	if (msg.type === "user-connect" && msg.userId) {
		const playerSaver = args[0] as PlayerSaver | undefined;
		let found = null;
		const userId = String(msg.userId);
		const allGuilds = Array.from(client.cache.guilds?.values() ?? []);

		for (const guild of allGuilds) {
			const guildId = (guild as { id: string }).id;
			const voiceState = client.cache.voiceStates?.get(userId, guildId);
			if (voiceState?.channelId) {
				found = {
					guildId,
					voiceChannelId: voiceState.channelId,
					player: null,
				};
				break;
			}
		}

		if (!found && typeof playerSaver?.getPlayer === "function") {
			for (const guild of allGuilds) {
				const guildId = (guild as { id: string }).id;
				const playerData = await playerSaver.getPlayer(guildId);
				if (playerData?.voiceChannelId) {
					const voiceState = client.cache.voiceStates?.get(userId, guildId);
					if (
						voiceState?.channelId &&
						voiceState.channelId === playerData.voiceChannelId
					) {
						found = {
							guildId,
							voiceChannelId: playerData.voiceChannelId,
							player: null,
						};
						break;
					}
				}
			}
		}
		if (found) {
			ws.store = ws.store || {};
			ws.store.guildId = found.guildId;
			ws.store.voiceChannelId = found.voiceChannelId;
			ws.store.userId = userId;
			ws.send(
				JSON.stringify({ type: "user-connect", ...found, success: true }),
			);
		} else {
			ws.send(
				JSON.stringify({
					type: "user-connect",
					success: false,
					message: "User not found in any voice channel with active player.",
				}),
			);
		}
		return true;
	}
	return false;
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
				return true;
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
		return true;
	}
	return false;
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
		return true;
	}
	return false;
};
