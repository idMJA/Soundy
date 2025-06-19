import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import type { UsingClient } from "seyfert";
import { sendVoteWebhook, PlayerSaver } from "#soundy/utils";
import { createTopAPI, createMusicAPI, createPlaylistAPI } from "./index";
import { setupSoundyWebSocket, setupPlayerStatusInterval } from "./ws";

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
	const playerSaver = new PlayerSaver(client.logger);

	// Add music, top, and playlist API endpoints
	app.use(createMusicAPI(client));
	app.use(createTopAPI(client));
	app.use(createPlaylistAPI(client));

	// Setup WebSocket and broadcast interval
	setupSoundyWebSocket(app, client, playerSaver);
	setupPlayerStatusInterval(() => app);

	// Listen Elysia
	app.listen({ port: client.config.serverPort });

	client.logger.info(
		`[API] REST and WebSocket servers listening on port ${client.config.serverPort}`,
	);
}
