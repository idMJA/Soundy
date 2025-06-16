import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import type { UsingClient } from "seyfert";
import { sendVoteWebhook, PlayerSaver } from "#soundy/utils";

// Extend Elysia WebSocket connection type to include per-connection context
export interface SoundyWS {
	send: (data: string) => void;
	store?: {
		guildId?: string;
		voiceChannelId?: string;
		userId?: string;
	};
	// Add any other properties/methods from the Elysia WS type as needed
}

interface VoteWebhookPayload {
	user: string;
	type: "upvote" | "test";
	query?: string;
	isWeekend: boolean;
}

interface ServerResponse {
	name: string;
	memberCount: number;
	avatar: string;
	badges: {
		verified: boolean;
		partnered: boolean;
	};
}

interface StatsResponse {
	total: {
		guilds: number;
		channels: number;
		users: number;
		voice_connections: number;
	};
	shards: Array<{
		id: number;
		guilds: number;
		channels: number;
		users: number;
		voice_connections: number;
	}>;
	timestamp: string;
}

export interface MusicPlayerStatus {
	connected: boolean;
	playing: boolean;
	paused: boolean;
	volume: number;
	position: number;
	current: {
		title: string;
		author: string;
		duration: number;
		uri: string;
		artwork?: string;
		isStream: boolean;
		position?: number;
	} | null;
	queue: Array<{
		title: string;
		author: string;
		duration: number;
		uri: string;
		artwork?: string;
		requester?: string;
	}>;
	repeatMode: number;
	autoplay: boolean;
}

export interface PlayRequest {
	query: string;
	voiceChannelId: string;
}

export interface VolumeRequest {
	volume: number;
}

/**
 * Creates music API routes for Soundy
 * @param client - The Soundy client instance
 * @returns Elysia app with music routes
 */
function createMusicAPI(client: UsingClient) {
	return (
		new Elysia({ prefix: "/api/music" })
			.use(
				cors({
					origin: true,
					methods: ["GET", "POST", "PUT", "DELETE"],
					allowedHeaders: ["Content-Type", "Authorization"],
				}),
			)
			.use(
				jwt({
					name: "jwt",
					secret:
						process.env.JWT_SECRET ||
						"soundy-default-secret-change-in-production",
				}),
			)

			// Health check
			.get("/health", () => ({
				status: "ok",
				timestamp: new Date().toISOString(),
			}))

			// Get player status
			.get("/status/:guildId", async ({ params: { guildId }, set }) => {
				try {
					const player = client.manager.getPlayer(guildId);

					if (!player) {
						return {
							connected: false,
							playing: false,
							paused: false,
							current: null,
							queue: [],
							volume: 0,
							position: 0,
							repeatMode: 0,
							autoplay: false,
						} as MusicPlayerStatus;
					}

					const current = player.queue.current;
					const queue = player.queue.tracks.slice(0, 20).map((track) => ({
						title: track.info.title || "Unknown",
						author: track.info.author || "Unknown",
						duration: track.info.duration || 0,
						uri: track.info.uri || "",
						artwork: track.info.artworkUrl || undefined,
						requester:
							track.requester &&
							typeof track.requester === "object" &&
							"id" in track.requester
								? String(track.requester.id)
								: undefined,
					}));

					const status: MusicPlayerStatus = {
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
						queue,
						repeatMode:
							player.repeatMode === "off"
								? 0
								: player.repeatMode === "track"
									? 1
									: 2,
						autoplay: player.get("enabledAutoplay") || false,
					};

					return status;
				} catch (error) {
					client.logger.error("Error getting player status:", error);
					set.status = 500;
					return { error: "Internal Server Error" };
				}
			})

			// Play a song
			.post(
				"/play/:guildId",
				async ({ params: { guildId }, body, set, headers }) => {
					try {
						// Basic auth check
						const authHeader = headers.authorization;
						if (!authHeader?.startsWith("Bearer ")) {
							set.status = 401;
							return { error: "Unauthorized - Bearer token required" };
						}

						const { query, voiceChannelId } = body as PlayRequest;

						if (!query || !voiceChannelId) {
							set.status = 400;
							return { error: "Query and voiceChannelId are required" };
						}

						// Get or create player
						let player = client.manager.getPlayer(guildId);
						if (!player) {
							player = client.manager.createPlayer({
								guildId: String(guildId),
								voiceChannelId: String(voiceChannelId),
								textChannelId: String(voiceChannelId), // set textChannelId ke id voice
								selfDeaf: true,
								volume: client.config.defaultVolume || 50,
							});
						}

						// Connect if not connected
						if (!player.connected) {
							await player.connect();
						}

						// Search for tracks
						const result = await player.search(query, {
							requester: { id: "web-user" },
						});

						switch (result.loadType) {
							case "track":
							case "search": {
								const track = result.tracks[0];
								if (!track) {
									set.status = 404;
									return { error: "No tracks found" };
								}

								track.requester = { id: getRequesterId(body, headers) };
								await player.queue.add(track);

								if (!player.playing && !player.paused) {
									await player.play();
								}

								return {
									success: true,
									message: `Added: ${track.info.title}`,
									track: {
										title: track.info.title,
										author: track.info.author,
										duration: track.info.duration,
										uri: track.info.uri,
										artwork: track.info.artworkUrl,
									},
								};
							}
							case "playlist": {
								for (const track of result.tracks) {
									track.requester = { id: getRequesterId(body, headers) };
								}
								await player.queue.add(result.tracks);

								if (!player.playing && !player.paused) {
									await player.play();
								}

								return {
									success: true,
									message: `Added playlist: ${result.playlist?.name || "Playlist"}`,
									tracksAdded: result.tracks.length,
								};
							}
							default:
								set.status = 404;
								return { error: "No results found" };
						}
					} catch (error) {
						client.logger.error("Error playing track:", error);
						set.status = 500;
						return { error: "Internal Server Error" };
					}
				},
				{
					body: t.Object({
						query: t.String(),
						voiceChannelId: t.String(),
					}),
				},
			)

			// Control playback
			.post(
				"/control/:guildId/:action",
				async ({ params: { guildId, action }, set, headers }) => {
					try {
						// Basic auth check
						const authHeader = headers.authorization;
						if (!authHeader?.startsWith("Bearer ")) {
							set.status = 401;
							return { error: "Unauthorized - Bearer token required" };
						}

						const player = client.manager.getPlayer(guildId);
						if (!player) {
							set.status = 404;
							return { error: "No active player found" };
						}

						switch (action.toLowerCase()) {
							case "pause":
								await player.pause();
								return { success: true, message: "Paused", action: "pause" };

							case "resume":
								await player.resume();
								return { success: true, message: "Resumed", action: "resume" };

							case "skip":
								await player.skip();
								return { success: true, message: "Skipped", action: "skip" };

							case "stop":
								await player.destroy();
								return { success: true, message: "Stopped", action: "stop" };

							case "shuffle":
								player.queue.shuffle();
								return {
									success: true,
									message: "Queue shuffled",
									action: "shuffle",
								};

							default:
								set.status = 400;
								return { error: `Invalid action: ${action}` };
						}
					} catch (error) {
						client.logger.error("Error controlling playback:", error);
						set.status = 500;
						return { error: "Internal Server Error" };
					}
				},
			)

			// Volume control
			.post(
				"/volume/:guildId",
				async ({ params: { guildId }, body, set, headers }) => {
					try {
						// Basic auth check
						const authHeader = headers.authorization;
						if (!authHeader?.startsWith("Bearer ")) {
							set.status = 401;
							return { error: "Unauthorized - Bearer token required" };
						}

						const { volume } = body as VolumeRequest;

						if (volume < 0 || volume > 100) {
							set.status = 400;
							return { error: "Volume must be between 0 and 100" };
						}

						const player = client.manager.getPlayer(guildId);
						if (!player) {
							set.status = 404;
							return { error: "No active player found" };
						}

						await player.setVolume(volume);
						return {
							success: true,
							volume,
							message: `Volume set to ${volume}%`,
						};
					} catch (error) {
						client.logger.error("Error setting volume:", error);
						set.status = 500;
						return { error: "Internal Server Error" };
					}
				},
				{
					body: t.Object({
						volume: t.Number(),
					}),
				},
			)

			// Get queue
			.get("/queue/:guildId", async ({ params: { guildId }, set }) => {
				try {
					const player = client.manager.getPlayer(guildId);
					if (!player) {
						return { current: null, queue: [], length: 0 };
					}

					const current = player.queue.current;
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
								? String(track.requester.id)
								: undefined,
					}));

					return {
						current: current
							? {
									title: current.info.title,
									author: current.info.author,
									duration: current.info.duration,
									position: player.position,
									uri: current.info.uri,
									artwork: current.info.artworkUrl,
								}
							: null,
						queue,
						length: queue.length,
					};
				} catch (error) {
					client.logger.error("Error getting queue:", error);
					set.status = 500;
					return { error: "Internal Server Error" };
				}
			})

			// Remove track from queue
			.delete(
				"/queue/:guildId/:index",
				async ({ params: { guildId, index }, set, headers }) => {
					try {
						// Basic auth check
						const authHeader = headers.authorization;
						if (!authHeader?.startsWith("Bearer ")) {
							set.status = 401;
							return { error: "Unauthorized - Bearer token required" };
						}

						const player = client.manager.getPlayer(guildId);
						if (!player) {
							set.status = 404;
							return { error: "No active player found" };
						}

						const trackIndex = Number.parseInt(index);
						if (
							Number.isNaN(trackIndex) ||
							trackIndex < 0 ||
							trackIndex >= player.queue.tracks.length
						) {
							set.status = 400;
							return { error: "Invalid track index" };
						}

						const removedTrack = player.queue.tracks[trackIndex];
						if (!removedTrack) {
							set.status = 404;
							return { success: false, message: "Track not found" };
						}

						player.queue.remove(trackIndex);

						return {
							success: true,
							message: `Removed: ${removedTrack.info.title || "Unknown track"}`,
							removedTrack: {
								title: removedTrack.info.title || "Unknown",
								author: removedTrack.info.author || "Unknown",
							},
						};
					} catch (error) {
						client.logger.error("Error removing track:", error);
						set.status = 500;
						return { error: "Internal Server Error" };
					}
				},
			)

			// Search tracks (without adding to queue)
			.get("/search", async ({ query: { q }, set }) => {
				try {
					if (!q) {
						set.status = 400;
						return { error: 'Query parameter "q" is required' };
					}

					// Use client.manager.search directly
					const result = await client.manager.search(
						q as string,
						client.config.defaultSearchPlatform,
					);

					switch (result.loadType) {
						case "track":
						case "search":
							return {
								tracks: result.tracks.slice(0, 10).map((track) => ({
									title: track.info.title || "Unknown",
									author: track.info.author || "Unknown",
									duration: track.info.duration || 0,
									uri: track.info.uri || "",
									artwork: track.info.artworkUrl || undefined,
									isStream: track.info.isStream || false,
								})),
							};
						case "playlist":
							return {
								playlist: {
									name: result.playlist?.name,
									trackCount: result.tracks.length,
								},
								tracks: result.tracks.slice(0, 10).map((track) => ({
									title: track.info.title || "Unknown",
									author: track.info.author || "Unknown",
									duration: track.info.duration || 0,
									uri: track.info.uri || "",
									artwork: track.info.artworkUrl || undefined,
								})),
							};
						default:
							return { tracks: [] };
					}
				} catch (error) {
					client.logger.error("Error searching tracks:", error);
					set.status = 500;
					return { error: "Internal Server Error" };
				}
			})
	);
}

// Message type for WebSocket
interface WSMessage {
	type: string;
	guildId?: string;
	[key: string]: unknown;
}

// Helper to serialize player state (copied from websocket.ts)
type LavalinkPlayer = {
	connected?: boolean;
	playing: boolean;
	paused: boolean;
	volume: number;
	position: number;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	queue: { current?: { info: any } | null; tracks: any[] };
	repeatMode: string;
	get: (key: string) => boolean | undefined;
};

function serializePlayerState(player: LavalinkPlayer) {
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

// PlayerSaver instance
let playerSaver: PlayerSaver | undefined;

/**
 * Start and start the Elysia server for API
 * @param client - The Soundy client instance
 */
export function APIServer(client: UsingClient): void {
	const app = new Elysia()
	    .use(swagger())
		.post("/vote", async ({ body, set }) => {
			const vote = body as VoteWebhookPayload;
			try {
				const voter = await client.users.fetch(vote.user);
				const webhookResponse = await sendVoteWebhook(client, voter);

				if (webhookResponse.ok) {
					return { success: true };
				}
				set.status = 500;
				return { error: "Failed to send webhook message" };
			} catch (error) {
				client.logger.error("Error handling vote:", error);
				set.status = 500;
				return { error: "Internal Server Error" };
			}
		})
		.get("/stats", async ({ set }) => {
			try {
				const shardStats: StatsResponse["shards"] = [];
				let totalGuilds = 0;
				let totalChannels = 0;
				let totalUsers = 0;
				let totalVoiceConnections = 0;

				// Get stats for current shard
				const guildCount = (await client.cache.guilds?.count?.()) ?? 0;
				const channelCount = (await client.cache.channels?.count?.("*")) ?? 0;
				const userCount = (await client.cache.users?.count?.()) ?? 0;
				const voiceConnections = client.manager.players.size;

				totalGuilds = guildCount;
				totalChannels = channelCount;
				totalUsers = userCount;
				totalVoiceConnections = voiceConnections;

				shardStats.push({
					id: 0, // TODO: Get shard id
					guilds: guildCount,
					channels: channelCount,
					users: userCount,
					voice_connections: voiceConnections,
				});

				const stats: StatsResponse = {
					total: {
						guilds: totalGuilds,
						channels: totalChannels,
						users: totalUsers,
						voice_connections: totalVoiceConnections,
					},
					shards: shardStats,
					timestamp: new Date().toISOString(),
				};

				return stats;
			} catch (error) {
				client.logger.error("Error getting stats:", error);
				set.status = 500;
				return { error: "Internal Server Error" };
			}
		})
		.get("/servers", async ({ set }) => {
			try {
				const guilds = Array.from(client.cache.guilds?.values() ?? []);
				const topGuilds: ServerResponse[] = guilds
					.sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
					.slice(0, 10)
					.map((guild) => ({
						name: guild.name,
						memberCount: guild.memberCount ?? 0,
						avatar: guild.iconURL({ size: 256 }) ?? "",
						badges: {
							verified: guild.verified ?? false,
							partnered: guild.partnered ?? false,
						},
					}));

				return topGuilds;
			} catch (error) {
				client.logger.error("Error getting top servers:", error);
				set.status = 500;
				return { error: "Internal Server Error" };
			}
		});

	// Initialize playerSaver with the logger from the client
	playerSaver = new PlayerSaver(client.logger);

	// Add music API endpoints
	app.use(createMusicAPI(client));
	app.use(createTopAPI(client));
	app.use(createPlaylistAPI(client));

	// Native WebSocket endpoint for real-time control
	app.ws("/ws", {
		open(ws: SoundyWS) {
			ws.send(
				JSON.stringify({
					type: "hello",
					message: "Welcome to Soundy WebSocket!",
				}),
			);
		},
		message: async (ws: SoundyWS, data) => {
			// Parse incoming message
			let msg: WSMessage;
			try {
				msg = typeof data === "string" ? JSON.parse(data) : data;
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
						volume: client.config.defaultVolume || 50,
					});
				if (!player.connected) {
					await player.connect();
				}
				try {
					const result = await player.search(msg.query, {
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
			// Get queue
			if (msg.type === "queue" && msg.guildId) {
				const player = client.manager.getPlayer(msg.guildId);
				if (player) {
					const queue = player.queue.tracks.map(
						(track: any, index: number) => ({
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
									? String(track.requester.id)
									: undefined,
						}),
					);
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
					const guildId = guild.id;
					const voiceState = client.cache.voiceStates?.get(userId, guildId);
					if (voiceState?.channelId) {
						// DO NOT create/connect player here!
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
						const guildId = guild.id;
						const playerData = await playerSaver.getPlayer(guildId);
						if (playerData?.voiceChannelId) {
							// Fetch user's voice state for this guild
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
					ws.store.voiceChannelId = found.voiceChannelId;
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
				const player =
					client.manager.getPlayer(guildId) ??
					client.manager.createPlayer({
						guildId: guildId,
						voiceChannelId: String(voiceChannelId),
						textChannelId: String(voiceChannelId), // set textChannelId ke id voice
						selfDeaf: true,
						volume: client.config.defaultVolume || 50,
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
			// Modifikasi serupa untuk pause, resume, skip, stop, queue, dst...
			// Set volume
			if (
				msg.type === "volume" &&
				msg.guildId &&
				typeof msg.volume === "number"
			) {
				const player = client.manager.getPlayer(msg.guildId);
				if (player) {
					await player.setVolume(msg.volume);
					ws.send(
						JSON.stringify({
							type: "volume",
							success: true,
							volume: player.volume,
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
		},
		close(ws: SoundyWS) {
			// Optionally handle disconnect
		},
	});

	// Listen Elysia
	app.listen({ port: client.config.serverPort });

	// Set global app instance for WS broadcast
	setApiAppInstance(app);

	client.logger.info(
		`[API] REST and WebSocket servers listening on port ${client.config.serverPort}`,
	);
}

// Helper: get global app instance for WS broadcast
let globalApiApp: any = null;

export function setApiAppInstance(app: any) {
    globalApiApp = app;
}

export function getApiAppInstance() {
    return globalApiApp;
}

// --- WebSocket broadcast helper ---
function broadcastPlayerStatus(guildId: string, player: any, app?: any) {
    const wsApp = app || globalApiApp;
    if (!wsApp || !wsApp.server || !wsApp.server.clients) return;
    // Kirim semua data player, now playing, queue, volume, posisi, repeat, autoplay, dsb
    const statusMsg = JSON.stringify({
        type: "status",
        guildId,
        ...serializePlayerState(player),
        queue: player.queue.tracks.map((track: any, index: number) => ({
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
                    ? String(track.requester.id)
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
                  requester: player.queue.current.requester && typeof player.queue.current.requester === "object" && "id" in player.queue.current.requester ? String(player.queue.current.requester.id) : undefined,
                  // Tambahkan info lain jika perlu
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
    for (const client of wsApp.server.clients) {
        if (client.readyState === 1) {
            client.send(statusMsg);
        }
    }
}

// --- Interval broadcast for all active players ---
setInterval(() => {
    if (!globalApiApp || !globalApiApp.server || !globalApiApp.server.clients) return;
    const client = globalApiApp.client || globalApiApp._client || undefined;
    if (!client || !client.manager) return;
    for (const player of client.manager.players.values()) {
        if (player.queue.current) {
            broadcastPlayerStatus(player.guildId, player);
        }
    }
}, 1000); // broadcast every 1s

// Helper to get context from message or ws.store
function getContext(msg: WSMessage, ws: SoundyWS) {
	return {
		guildId: msg.guildId || ws.store?.guildId,
		voiceChannelId: msg.voiceChannelId || ws.store?.voiceChannelId,
	};
}

// Helper to get the requester userId for this connection/message
function getRequesterId(msg: WSMessage, ws: SoundyWS) {
	return String(msg.userId || ws.store?.userId || "websocket-user");
}

// Top API routes
function createTopAPI(client: UsingClient) {
    return new Elysia({ prefix: "/api/top" })
        .get("/tracks", async ({ query }) => {
            const guildId = query.guildId || "";
            const limit = Number(query.limit) || 10;
            const tracks = await client.database.getTopTracks(guildId, limit);
            return { tracks };
        })
        .get("/users", async ({ query }) => {
            const guildId = query.guildId || "";
            const limit = Number(query.limit) || 10;
            const users = await client.database.getTopUsers(guildId, limit);
            return { users };
        })
        .get("/guilds", async ({ query }) => {
            const limit = Number(query.limit) || 10;
            const guilds = await client.database.getTopGuilds(limit);
            return { guilds };
        });
}

// Playlist API routes
function createPlaylistAPI(client: UsingClient) {
    return new Elysia({ prefix: "/api/playlist" })
        .get("/list/:userId", async ({ params }) => {
            const playlists = await client.database.getPlaylists(params.userId);
            return { playlists };
        })
        .get("/view/:userId/:name", async ({ params }) => {
            const playlist = await client.database.getPlaylist(params.userId, params.name);
            if (!playlist) return { error: "Playlist not found" };
            return { playlist };
        })
        .post("/create", async ({ body }) => {
            const { userId, name, guildId } = body;
            await client.database.createPlaylist(userId, name, guildId);
            return { success: true };
        })
        .post("/add", async ({ body }) => {
            const { userId, playlist, tracks } = body;
            await client.database.addTracksToPlaylist(userId, playlist, tracks);
            return { success: true };
        })
        .post("/remove", async ({ body }) => {
            const { userId, playlist, trackUri } = body;
            await client.database.removeSong(userId, playlist, trackUri);
            return { success: true };
        })
        .post("/delete", async ({ body }) => {
            const { userId, name } = body;
            await client.database.deletePlaylist(userId, name);
            return { success: true };
        });
}
