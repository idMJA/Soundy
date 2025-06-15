import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import type { UsingClient } from "seyfert";
import { sendVoteWebhook } from "#soundy/utils";

// Remove Socket.io import and websocket init
// import { initWebSocketServer } from "./websocket";

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
								guildId,
								voiceChannelId,
								// textChannelId: null, // Web request doesn't need text channel
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

								track.requester = { id: "web-user" };
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
									track.requester = { id: "web-user" };
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

/**
 * Start and start the Elysia server for API
 * @param client - The Soundy client instance
 */
export function APIServer(client: UsingClient): void {
	const app = new Elysia()
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

	// Add music API endpoints
	app.use(createMusicAPI(client));

	// Native WebSocket endpoint for real-time control
	app.ws("/ws", {
		open(ws) {
			ws.send(
				JSON.stringify({
					type: "hello",
					message: "Welcome to Soundy WebSocket!",
				}),
			);
		},
		message: async (ws, data) => {
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
		},
		close(ws) {
			// Optionally handle disconnect
		},
	});

	// Listen Elysia
	app.listen({ port: client.config.serverPort });

	client.logger.info(
		`[API] REST and WebSocket servers listening on port ${client.config.serverPort}`,
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
