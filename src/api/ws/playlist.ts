import type { WSHandler } from "./types";
import { getRequesterId } from "./types";

export const handleLoadPlaylist: WSHandler = async (ws, msg, client) => {
	if (
		msg.type === "load-playlist" &&
		msg.guildId &&
		msg.playlistId &&
		msg.userId &&
		msg.voiceChannelId
	) {
		const { guildId } = msg;
		const userId = String(msg.userId);
		const playlistId = String(msg.playlistId);
		const voiceChannelId = String(msg.voiceChannelId);

		if (!voiceChannelId.trim()) {
			ws.send(
				JSON.stringify({
					type: "load-playlist",
					success: false,
					message: "voiceChannelId is required",
				}),
			);
			return true;
		}

		try {
			const playlist = await client.database.getPlaylistById(playlistId);
			if (!playlist || playlist.userId !== userId) {
				ws.send(
					JSON.stringify({
						type: "load-playlist",
						success: false,
						message: "Playlist not found or access denied",
					}),
				);
				return true;
			}

			const tracks = await client.database.getTracksFromPlaylist(playlistId);

			if (!tracks || tracks.length === 0) {
				ws.send(
					JSON.stringify({
						type: "load-playlist",
						success: false,
						message: "Playlist is empty",
					}),
				);
				return true;
			}

			const { defaultVolume } = await client.database.getPlayer(guildId);

			let player = client.manager.players.get(guildId);
			if (!player) {
				player = client.manager.createPlayer({
					guildId: guildId,
					voiceChannelId: voiceChannelId,
					textChannelId: voiceChannelId,
					volume: defaultVolume || client.config.defaultVolume,
					selfDeaf: true,
				});
				await player.connect();
			}

			let addedCount = 0;
			const requesterId = getRequesterId(msg, ws);

			for (const trackData of tracks) {
				try {
					const result = await client.manager.search(trackData.url);
					if (result.tracks[0]) {
						const track = result.tracks[0];
						track.requester = { id: requesterId };
						await player.queue.add(track);
						addedCount++;
					}
				} catch (error) {
					client.logger?.error?.(
						`Failed to load track ${trackData.url}:`,
						error,
					);
				}
			}

			if (!(player.playing || player.paused) && addedCount > 0) {
				await player.play();
			}

			ws.send(
				JSON.stringify({
					type: "load-playlist",
					success: true,
					message: `Loaded ${addedCount} tracks from playlist "${playlist.name}"`,
					tracksLoaded: addedCount,
					totalTracks: tracks.length,
					playlistId: playlistId,
					playlistName: playlist.name,
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "load-playlist",
					success: false,
					message: `Error loading playlist: ${String(error)}`,
				}),
			);
		}
		return true;
	}
	return false;
};

export const handleUserPlaylists: WSHandler = async (ws, msg, client) => {
	if (msg.type === "user-playlists" && msg.userId) {
		try {
			const playlists = await client.database.getPlaylists(String(msg.userId));
			ws.send(
				JSON.stringify({
					type: "user-playlists",
					playlists: playlists.map((playlist) => ({
						id: playlist.id,
						name: playlist.name,
						trackCount: playlist.tracks?.length || 0,
						createdAt: playlist.createdAt || undefined,
					})),
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "user-playlists",
					success: false,
					message: `Failed to get playlists: ${String(error)}`,
				}),
			);
		}
		return true;
	}
	return false;
};
