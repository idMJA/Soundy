// WebSocket helpers and setup for Soundy
import type { Elysia } from "elysia";
import type { SoundyWS, WSMessage, ElysiaApp, PlayerSaver } from "./types";
import type { UsingClient } from "seyfert";
import type { Player } from "lavalink-client";

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

// --- WebSocket setup for Soundy ---
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
			// Parse incoming message
			let msg: WSMessage;
			try {
				msg = typeof data === "string" ? JSON.parse(data) : (data as WSMessage);
			} catch {
				ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}
			// Example: handle player status request
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
			// Pause player
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
			// Resume player
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
			// Play track (query bisa link atau keyword)
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
						textChannelId: msg.voiceChannelId, // set textChannelId ke id voice
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
							// Saat assign requester, pastikan bentuknya { id: string }
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
							// Saat assign requester, pastikan bentuknya { id: string }
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
			// Get queue
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
			// Skip track
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
			// Stop player
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
			// Check user voice state and player
			if (msg.type === "user-status" && msg.userId) {
				// Cari user di semua guild yang ada player aktif
				let found = null;
				for (const player of client.manager.players.values()) {
					const guildId = player.guildId;
					// Ensure both arguments are strings
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
			// User connect: find guild/channel for user and set context
			if (msg.type === "user-connect" && msg.userId) {
				let found = null;
				const userId = String(msg.userId);
				const allGuilds = Array.from(client.cache.guilds?.values() ?? []);
				// 1. Check in-memory cache and live members (existing logic)
				for (const guild of allGuilds) {
					// Gunakan type assertion ke { id: string } jika perlu
					const guildId = (guild as { id: string }).id;
					const voiceState = client.cache.voiceStates?.get(userId, guildId);
					if (voiceState?.channelId) {
						found = {
							guildId,
							voiceChannelId: voiceState.channelId,
							player: null, // No player state, just context
						};
						break;
					}
				}
				// 2. Check persistent player data and fetch voice state for each
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
									player: null, // No player state, just context
								};
								break;
							}
						}
					}
				}
				if (found) {
					ws.store = ws.store || {};
					ws.store.guildId = found.guildId;
					ws.store.voiceChannelId = found.voiceChannelId; // Selalu update ke VC terbaru
					ws.store.userId = userId; // Always set userId in ws.store
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
			// Contoh modifikasi play, pause, dst:
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
				// Update VC di ws.store jika play di VC lain
				if (!ws.store) ws.store = {};
				ws.store.guildId = guildId;
				ws.store.voiceChannelId = String(voiceChannelId);
				const player =
					client.manager.getPlayer(guildId) ??
					client.manager.createPlayer({
						guildId: guildId,
						voiceChannelId: String(voiceChannelId),
						textChannelId: String(voiceChannelId), // set textChannelId ke id voice
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
			// Set volume
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
		},
	});
}

// Custom type for Elysia app with client property
interface ElysiaWithClient extends Elysia {
	client: UsingClient;
}

// Type for WebSocket server with clients property
interface WebSocketServerWithClients {
	clients?: Set<{ readyState: number; send: (msg: string) => void }>;
}

// Helper agar akses clients type-safe tanpa any di seluruh kode
function getWsClients(app: Elysia | ElysiaApp) {
	const server = app.server as WebSocketServerWithClients;
	if (!server || !server.clients) {
		return null; // Return null if no clients
	}
	return server.clients;
}

// --- WebSocket broadcast helper ---
function broadcastPlayerStatus(
	guildId: string,
	player: Player,
	app: ElysiaApp | Elysia,
) {
	const clients = getWsClients(app);
	if (!clients) return; // Ensure clients is not null
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

export function setupPlayerStatusInterval(getApp: () => Elysia) {
	setInterval(() => {
		const app = getApp() as ElysiaWithClient;
		const clients = getWsClients(app);
		if (!clients) return;
		if (!app.client || !app.client.manager) return;
		for (const player of app.client.manager.players.values()) {
			if (player.queue.current) {
				broadcastPlayerStatus(player.guildId, player, app);
			}
		}
	}, 1000);
}
