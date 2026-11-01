import crypto from "node:crypto";
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
	user?: string;
	user_id?: string;
	platform_id?: string;
	type?: string;
	query?: string;
	isWeekend?: boolean;
	data?: {
		user?: {
			id?: string;
			platform_id?: string;
			name?: string;
			avatar_url?: string;
		};
		project?: {
			id?: string;
			type?: string;
			platform?: string;
			platform_id?: string;
		};
	};
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

interface ElysiaHandlerContext {
	body?: unknown;
	headers: Record<string, string | undefined>;
	set: { status?: number | string };
}

interface ElysiaGetContext {
	set: { status?: number | string };
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function APIServer(client: UsingClient): void {
	const app = new Elysia()
		.onRequest(({ request, set }): unknown => {
			const ip =
				request.headers.get("x-forwarded-for") ||
				request.headers.get("x-real-ip") ||
				"global";
			const now = Date.now();
			const windowMs = 60000;
			const maxRequests = 100;

			const entry = rateLimitStore.get(ip);
			if (!entry || now > entry.resetAt) {
				rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
				return;
			}

			entry.count++;
			if (entry.count > maxRequests) {
				set.status = 429;
				return { error: "Too Many Requests. Please try again later." };
			}
			return;
		})
		.use(
			openapi({
				path: "/docs",
				documentation: {
					info: {
						title: "Soundy API Documentation",
						version: BOT_VERSION,
						description:
							"REST & WebSocket API for Soundy Discord Music Bot - Control music playback, manage playlists, access public bot stats, and handle bot webhooks.",
					},
					tags: [
						{
							name: "Dashboard - Music",
							description:
								"Music playback and player control endpoints for Dashboard",
						},
						{
							name: "Dashboard - Playlist",
							description: "User playlist management endpoints for Dashboard",
						},
						{
							name: "Dashboard - Top Charts",
							description:
								"Top played tracks, users, and guild charts for Dashboard",
						},
						{
							name: "Public Stats",
							description:
								"Publicly accessible bot statistics and server listings",
						},
						{
							name: "Webhooks (Internal)",
							description:
								"Internal webhook endpoints (e.g. top.gg vote processor)",
						},
					],
				},
			}),
		);

	const playerSaver = new PlayerSaver(client.logger);

	applyAPIRoutes(app as unknown as Elysia, client);

	Object.assign(app, { client });

	setupSoundyWebSocket(app as unknown as ElysiaApp, client, playerSaver);

	setGlobalAppInstance(app as unknown as ElysiaApp);

	app
		.post(
			"/vote",
			async ({ body, headers, set }: ElysiaHandlerContext) => {
				const secret = client.config.topgg.webhookAuth;

				if (secret) {
					const signature =
						(headers["x-topgg-signature"] as string | undefined) ||
						(headers["x-signature"] as string | undefined);
					const authHeader = headers.authorization;

					let isValid = false;

					// 1. Direct Authorization token check (dashboard setting)
					if (authHeader && authHeader === secret) {
						isValid = true;
					}

					// 2. Top.gg v1 HMAC SHA-256 Signature Verification: t={unix_timestamp},v1={hex_signature}
					if (!isValid && signature) {
						try {
							const rawPayload =
								typeof body === "string" ? body : JSON.stringify(body);
							let timestamp = "";
							let receivedSig = "";

							const parts = signature.split(",");
							for (const part of parts) {
								const [k, v] = part.split("=");
								if (k?.trim() === "t") timestamp = v?.trim() ?? "";
								if (k?.trim() === "v1") receivedSig = v?.trim() ?? "";
							}

							const dataToSign = timestamp
								? `${timestamp}.${rawPayload}`
								: rawPayload;
							const expectedSignature = crypto
								.createHmac("sha256", secret)
								.update(dataToSign)
								.digest("hex");

							if (
								receivedSig &&
								receivedSig.length === expectedSignature.length &&
								crypto.timingSafeEqual(
									Buffer.from(receivedSig),
									Buffer.from(expectedSignature),
								)
							) {
								isValid = true;
							}
						} catch {
							isValid = false;
						}
					}

					if (!isValid) {
						client.logger.warn(
							"[Vote] Unauthorized vote webhook attempt detected",
						);
						set.status = 401;
						return {
							error: "Unauthorized: Invalid webhook signature or token",
						};
					}
				}

				const vote = (
					typeof body === "string" ? JSON.parse(body) : body
				) as VoteWebhookPayload;

				const isTest = vote.type === "webhook.test" || vote.type === "test";

				const userId =
					vote.data?.user?.platform_id ||
					vote.data?.user?.id ||
					vote.user_id ||
					vote.platform_id ||
					vote.user;

				if (isTest) {
					client.logger.info(
						"[Vote] Received test webhook from Top.gg successfully",
					);

					if (userId) {
						try {
							const voter = (await client.users
								.fetch(userId)
								.catch(() => null)) || {
								id: userId,
								username: vote.data?.user?.name || "Top.gg Tester",
								name: vote.data?.user?.name || "Top.gg Tester",
								avatar: null,
							};
							await sendVoteWebhook(client, voter, true);
						} catch (webhookErr) {
							client.logger.warn(
								`[Vote] Failed to send test vote notification to Discord: ${webhookErr}`,
							);
						}
					}
					set.status = 200;
					return {
						success: true,
						message: "Test webhook received and Discord notification sent",
					};
				}

				// Validate required user ID field
				if (!userId) {
					set.status = 400;
					return { error: "Missing user ID in vote payload" };
				}

				try {
					const voter = await client.users.fetch(userId).catch(() => null);
					if (!voter) {
						client.logger.warn(`[Vote] User ${userId} not found in Discord`);
						set.status = 200;
						return { success: false, message: "User not found on Discord" };
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
					tags: ["Webhooks (Internal)"],
				},
			},
		)
		.get(
			"/stats",
			async ({ set }: ElysiaGetContext) => {
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

					const shardId =
						(client as { shardId?: number }).shardId ??
						(client as { gateway?: { shardId?: number } }).gateway?.shardId ??
						0;

					shardStats.push({
						id: shardId,
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
					tags: ["Public Stats"],
				},
			},
		)
		.get(
			"/servers",
			async ({ set }: ElysiaGetContext) => {
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
					tags: ["Public Stats"],
				},
			},
		);

	app.listen({ port: client.config.serverPort });

	client.logger.info(
		`[API] REST and WebSocket servers listening on port ${client.config.serverPort}`,
	);
}
