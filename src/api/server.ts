import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import type { UsingClient } from "seyfert";
import type { ElysiaApp } from "#soundy/api";
import {
	applyAPIRoutes,
	setGlobalAppInstance,
	setupSoundyWebSocket,
} from "#soundy/api";
import { BOT_VERSION, PlayerSaver, sendVoteWebhook } from "#soundy/utils";

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
	const app = new Elysia().use(
		openapi({
			path: "/docs",
			documentation: {
				info: {
					title: "Soundy API Documentation",
					version: BOT_VERSION,
					description:
						"REST API for Soundy Discord Music Bot - Control music playback, manage playlists, and monitor server statistics",
				},
				tags: [
					{ name: "Music", description: "Music playback endpoints" },
					{ name: "Playlist", description: "Playlist management endpoints" },
					{ name: "Statistics", description: "Bot statistics and monitoring" },
					{
						name: "Webhooks",
						description: "Webhook endpoints for integrations",
					},
				],
			},
		}),
	);

	const playerSaver = new PlayerSaver(client.logger);

	applyAPIRoutes(app, client);

	Object.assign(app, { client });

	setupSoundyWebSocket(app as ElysiaApp, client, playerSaver);

	setGlobalAppInstance(app as ElysiaApp);

	app
		.post(
			"/vote",
			async ({ body, set }) => {
				const vote = body as VoteWebhookPayload;

				// Validate required fields
				if (!vote.user) {
					set.status = 400;
					return { error: "Missing user field" };
				}

				try {
					const voter = await client.users.fetch(vote.user);
					if (!voter) {
						set.status = 404;
						return { error: "User not found" };
					}

					// check if user already has an active vote premium to prevent spam
					const hasActivePremium = await client.database.hasActivePremium(
						voter.id,
					);
					if (hasActivePremium) {
						const premiumStatus = await client.database.getPremiumStatus(
							voter.id,
						);
						if (premiumStatus && premiumStatus.type === "vote") {
							client.logger.info(
								`[Vote] User ${voter.username} (${voter.id}) already has active vote premium, extending expiration`,
							);
						}
					}

					const webhookSuccess = await sendVoteWebhook(client, voter);

					if (webhookSuccess) {
						return {
							success: true,
							message: `Vote processed for ${voter.username}`,
						};
					}

					// this shouldn't happen with the current implementation
					// but kept for safety
					return {
						success: true,
						message: `Vote processed for ${voter.username} (webhook issue)`,
					};
				} catch (error) {
					client.logger.error("Error handling vote:", error);
					set.status = 500;
					return {
						error: "Internal Server Error",
						details: error instanceof Error ? error.message : "Unknown error",
					};
				}
			},
			{
				detail: {
					summary: "Process vote webhook",
					description: "Webhook endpoint for processing user votes from top.gg",
					tags: ["Webhooks"],
				},
			},
		)
		.get(
			"/stats",
			async ({ set }) => {
				try {
					const shardStats: StatsResponse["shards"] = [];
					let totalGuilds = 0;
					let totalChannels = 0;
					let totalUsers = 0;
					let totalVoiceConnections = 0;

					// Get stats for current shard
					const guildCount = client.cache.guilds?.count?.() ?? 0;
					const channelCount = client.cache.channels?.count?.("*") ?? 0;
					const userCount = client.cache.users?.count?.() ?? 0;
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
			},
			{
				detail: {
					summary: "Get bot statistics",
					description:
						"Retrieve comprehensive statistics about the bot including guilds, channels, users, and voice connections per shard",
					tags: ["Statistics"],
				},
			},
		)
		.get(
			"/servers",
			async ({ set }) => {
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
			},
			{
				detail: {
					summary: "Get top servers",
					description:
						"Retrieve the top 10 servers by member count where the bot is present",
					tags: ["Statistics"],
				},
			},
		);

	app.listen({ port: client.config.serverPort });

	client.logger.info(
		`[API] REST and WebSocket servers listening on port ${client.config.serverPort}`,
	);
}
