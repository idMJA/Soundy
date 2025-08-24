import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import type { UsingClient } from "seyfert";
import type { MusicPlayerStatus } from "#soundy/api";

export function createMusicAPI(client: UsingClient) {
	return new Elysia({ prefix: "/api/music" })
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

		.get("/health", () => ({
			status: "ok",
			timestamp: new Date().toISOString(),
		}))

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

		.get("/search", async ({ query: { q }, set }) => {
			try {
				if (!q) {
					set.status = 400;
					return { error: 'Query parameter "q" is required' };
				}

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

		.get("/liked/:userId", async ({ params: { userId }, set }) => {
			try {
				const likedSongs = await client.database.getLikedSongs(userId);
				return { likedSongs };
			} catch (error) {
				client.logger.error("Error fetching liked songs:", error);
				set.status = 500;
				return { error: "Internal Server Error" };
			}
		})

		.post("/like", async ({ body, set }) => {
			interface LikeRequestBody {
				userId: string;
				uri?: string;
				action: "like" | "unlike";
				id?: string;
			}
			const { userId, uri, action, id } = body as LikeRequestBody;

			if (!userId || !uri || !action) {
				set.status = 400;
				return { error: "Missing required fields: userId, uri, action" };
			}

			try {
				if (action === "like") {
					const result = await client.manager.search(
						uri,
						client.config.defaultSearchPlatform,
					);
					const found = result.tracks?.[0];
					if (!found) {
						set.status = 404;
						return { error: "Track not found for the given uri" };
					}

					const trackId = found.encoded || found.info.identifier;
					const title = found.info.title || "Unknown Title";
					const author = found.info.author || "Unknown Author";
					const artwork = found.info.artworkUrl ?? undefined;
					const length = found.info.duration;
					const isStream = found.info.isStream;
					const resolvedUri = found.info.uri;

					const success = await client.database.addToLikedSongs(
						userId,
						trackId,
						title,
						author,
						resolvedUri,
						artwork,
						length,
						isStream,
					);
					return { success };
				} else if (action === "unlike") {
					if (!id) {
						set.status = 400;
						return { error: "Missing required field: id for unlike" };
					}
					const success = await client.database.removeFromLikedSongs(
						userId,
						id,
					);
					return { success };
				} else {
					set.status = 400;
					return { error: 'Invalid action. Use "like" or "unlike".' };
				}
			} catch (error) {
				client.logger.error("Error updating liked songs:", error);
				set.status = 500;
				return { error: "Internal Server Error" };
			}
		})

		.get("/recent/:userId", async ({ params, query }) => {
			const limit = query.limit ? parseInt(query.limit as string, 10) : 10;
			const guildId = query.guildId as string | undefined;
			try {
				const recentTracks = await client.database.getRecentlyPlayed(
					params.userId,
					guildId,
					Math.min(limit, 50),
				);
				return { tracks: recentTracks };
			} catch (error) {
				client.logger.error("Error fetching recently played:", error);
				return { tracks: [] };
			}
		});
}
