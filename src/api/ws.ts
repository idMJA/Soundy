import type { Elysia } from "elysia";
import type { SoundyWS, WSMessage, ElysiaApp } from "#soundy/api";
import type { UsingClient } from "seyfert";
import type { Player } from "lavalink-client";
import { PlayerSaver } from "#soundy/utils";

export function serializePlayerState(player: Player) {
	const current = player.queue.current;
	return {
		connected: player.connected ?? false,
		playing: player.playing,
		paused: player.paused,
		volume: player.volume,
		position: player.position,
		current: current
			? {
					title: current.info.title,
					author: current.info.author,
					duration: current.info.duration,
					uri: current.info.uri,
					artwork: current.info.artworkUrl || undefined,
					isStream: current.info.isStream,
					position: player.position,
					albumName: current.pluginInfo.albumName,
				}
			: null,
		repeatMode:
			player.repeatMode === "off" ? 0 : player.repeatMode === "track" ? 1 : 2,
		autoplay: player.get("enabledAutoplay") || false,
	};
}

export function getContext(msg: WSMessage, ws: SoundyWS) {
	return {
		guildId: msg.guildId || ws.store?.guildId,
		voiceChannelId: msg.voiceChannelId || ws.store?.voiceChannelId,
	};
}

export function getRequesterId(msg: WSMessage, ws: SoundyWS) {
	return String(msg.userId || ws.store?.userId || "websocket-user");
}

export function setupSoundyWebSocket(
	app: Elysia,
	client: UsingClient,
	playerSaver: PlayerSaver,
) {
	app.ws("/ws", {
		open(ws: SoundyWS) {
			ws.send(
				JSON.stringify({
					type: "hello",
					message: "Welcome to Soundy WebSocket!",
				}),
			);
		},
		message: async (ws: SoundyWS, data: unknown) => {
			let msg: WSMessage;
			try {
				msg = typeof data === "string" ? JSON.parse(data) : (data as WSMessage);
			} catch {
				ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}

			if (msg.type === "status" && msg.guildId) {
				const player = client.manager.getPlayer(msg.guildId);
				if (player) {
					ws.send(
						JSON.stringify({ type: "status", ...serializePlayerState(player) }),
					);
				} else {
					ws.send(JSON.stringify({ type: "status", connected: false }));
				}
				return;
			}

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
				return;
			}

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
				return;
			}

			if (
				msg.type === "play" &&
				msg.guildId &&
				msg.query &&
				msg.voiceChannelId
			) {
				if (
					typeof msg.voiceChannelId !== "string" ||
					!msg.voiceChannelId.trim()
				) {
					ws.send(
						JSON.stringify({
							type: "play",
							success: false,
							message: "voiceChannelId harus string",
						}),
					);
					return;
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
				return;
			}

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
					ws.send(
						JSON.stringify({ type: "queue", queue, length: queue.length }),
					);
				} else {
					ws.send(JSON.stringify({ type: "queue", queue: [], length: 0 }));
				}
				return;
			}

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
						return;
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
				return;
			}

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
				return;
			}

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
							player: serializePlayerState(player),
						};
						break;
					}
				}
				if (found) {
					ws.send(JSON.stringify({ type: "user-status", ...found }));
				} else {
					ws.send(JSON.stringify({ type: "user-status", found: false }));
				}
				return;
			}

			if (msg.type === "user-connect" && msg.userId) {
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
							message:
								"User not found in any voice channel with active player.",
						}),
					);
				}
				return;
			}

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
					return;
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
				return;
			}

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
				return;
			}

			if (msg.type === "repeat" && msg.guildId) {
				const player = client.manager.getPlayer(msg.guildId);
				if (player) {
					let newMode: "off" | "track" | "queue";
					if (player.repeatMode === "off") newMode = "track";
					else if (player.repeatMode === "track") newMode = "queue";
					else newMode = "off";

					await player.setRepeatMode(newMode);

					try {
						const playerSaver = new PlayerSaver(client.logger);
						const playerData = player.toJSON();
						playerData.repeatMode = newMode;
						const safeData = playerSaver.extractSafePlayerData(
							playerData as unknown as Record<string, unknown>,
						);
						await playerSaver.savePlayer(player.guildId, safeData);
					} catch (e) {
						client.logger.error("Failed to save repeatMode to PlayerSaver", e);
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
				return;
			}

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
						return;
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
				return;
			}

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
					return;
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
						return;
					}

					const tracks =
						await client.database.getTracksFromPlaylist(playlistId);

					if (!tracks || tracks.length === 0) {
						ws.send(
							JSON.stringify({
								type: "load-playlist",
								success: false,
								message: "Playlist is empty",
							}),
						);
						return;
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
				return;
			}

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
		},
	});
}

interface WebSocketServerWithClients {
	clients?: Set<{ readyState: number; send: (msg: string) => void }>;
}

let globalAppInstance: ElysiaApp | Elysia | null = null;

function getWsClients(app: Elysia | ElysiaApp) {
	const server = app.server as WebSocketServerWithClients;
	if (!server || !server.clients) {
		return null;
	}
	return server.clients;
}

export function setGlobalAppInstance(app: ElysiaApp | Elysia) {
	globalAppInstance = app;
}

function broadcastPlayerStatus(
	guildId: string,
	player: Player,
	app: ElysiaApp | Elysia,
) {
	const clients = getWsClients(app);
	if (!clients) return;
	const statusMsg = JSON.stringify({
		type: "status",
		guildId,
		...serializePlayerState(player),
		queue: player.queue.tracks.map((track, index: number) => ({
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
		})),
		current: player.queue.current
			? {
					title: player.queue.current.info.title,
					author: player.queue.current.info.author,
					duration: player.queue.current.info.duration,
					uri: player.queue.current.info.uri,
					artwork: player.queue.current.info.artworkUrl || undefined,
					isStream: player.queue.current.info.isStream,
					position: player.position,
					requester:
						player.queue.current.requester &&
						typeof player.queue.current.requester === "object" &&
						"id" in player.queue.current.requester
							? (player.queue.current.requester as { id: string }).id
							: undefined,
				}
			: null,
		position: player.position,
		volume: player.volume,
		paused: player.paused,
		playing: player.playing,
		repeatMode: player.repeatMode,
		autoplay: player.get("enabledAutoplay") || false,
		connected: player.connected ?? false,
	});
	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(statusMsg);
		}
	}
}

export function broadcastPlayerUpdate(guildId: string, player: Player) {
	if (globalAppInstance) {
		broadcastPlayerStatus(guildId, player, globalAppInstance);
	}
}

export function broadcastPlayerEvent(
	guildId: string,
	player: Player,
	eventType: string,
	eventData?: unknown,
) {
	if (!globalAppInstance) return;

	const clients = getWsClients(globalAppInstance);
	if (!clients) return;

	const eventMsg = JSON.stringify({
		type: "player-event",
		eventType,
		guildId,
		...serializePlayerState(player),
		eventData,
		timestamp: Date.now(),
	});

	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(eventMsg);
		}
	}
}

export function broadcastPlayerDisconnection(guildId: string) {
	if (!globalAppInstance) return;

	const clients = getWsClients(globalAppInstance);
	if (!clients) return;

	const disconnectionMsg = JSON.stringify({
		type: "status",
		guildId,
		connected: false,
		playing: false,
		paused: false,
		volume: 0,
		position: 0,
		current: null,
		queue: [],
		repeatMode: 0,
		autoplay: false,
	});

	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(disconnectionMsg);
		}
	}
}
