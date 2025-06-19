import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import type { UsingClient } from "seyfert";
import type { MusicPlayerStatus } from "./index";

export function createMusicAPI(client: UsingClient) {
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
