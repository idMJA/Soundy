import { join } from "node:path";
import { cwd } from "node:process";
import ky from "ky";
import { createEvent } from "seyfert";
import { BOT_VERSION, changePresence } from "#soundy/utils";

export default createEvent({
	data: { once: true, name: "ready" },
	async run(user, client, shard) {
		await client
			.uploadCommands({
				cachePath: join(cwd(), client.config.cache.filename),
			})
			.catch(client.logger.error);

		await client.manager
			.init({
				id: user.id,
				username: user.username,
				shard: "auto",
			})
			.catch(client.logger.error);

		const clientName = `${user.username} v${BOT_VERSION}`;
		client.logger.info(`Logged in as "${clientName}" on Shard ${shard}`);

		changePresence(client);

		if (client.config.topgg.enabled && client.config.topgg.token) {
			setTimeout(postStats, 5000);

			setInterval(postStats, 30 * 60 * 1000);

			client.logger.info("[Top.gg] Auto Poster initialized");
		} else {
			client.logger.info("[Top.gg] Auto Poster disabled");
		}

		setInterval(
			async () => {
				try {
					await client.database.cleanupExpiredVotes();
					client.logger.debug("[Database] Expired vote cleanup completed");
				} catch (error) {
					client.logger.error(
						"[Database] Failed to cleanup expired votes:",
						error,
					);
				}
			},
			60 * 60 * 1000,
		);

		client.logger.info("[Database] Periodic vote cleanup initialized");

		async function postStats() {
			try {
				let guildCount = client.cache.guilds?.count();
				if (typeof guildCount !== "number" || Number.isNaN(guildCount))
					guildCount = 0;
				const shardCount = client.gateway.totalShards;

				if (client.topgg) {
					await client.topgg.postMetrics({
						serverCount: guildCount,
						shardCount: shardCount,
					});
				} else {
					const token = client.config.topgg.token.startsWith("Bearer ")
						? client.config.topgg.token
						: `Bearer ${client.config.topgg.token}`;

					await ky.patch("https://top.gg/api/v1/projects/@me/metrics", {
						headers: { Authorization: token },
						json: {
							server_count: guildCount,
							shard_count: shardCount,
						},
					});
				}

				client.logger.info(
					`[Top.gg] Metrics posted | Servers: ${guildCount} | Shards: ${shardCount}`,
				);
			} catch (error) {
				client.logger.error("[Top.gg] Failed to post metrics:", error);
			}
		}
	},
});
