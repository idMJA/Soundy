import { createEvent } from "seyfert";
import { join } from "node:path";
import { cwd } from "node:process";
import { Api } from "@top-gg/sdk";
import { BOT_VERSION } from "#soundy/utils";

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

		if (client.config.topgg.enabled && client.config.topgg.token) {
			setTimeout(postStats, 5000);

			setInterval(postStats, 30 * 60 * 1000);

			client.logger.info("[Top.gg] Auto Poster initialized");
		} else {
			client.logger.info("[Top.gg] Auto Poster disabled");
		}

		async function postStats() {
			try {
				const api = new Api(client.config.topgg.token);
				let guildCount = client.cache.guilds?.count();
				if (typeof guildCount !== "number" || Number.isNaN(guildCount))
					guildCount = 0;
				const shardCount = client.gateway.totalShards;

				await api.postStats({
					serverCount: guildCount,
					shardCount,
				});

				client.logger.info(
					`[Top.gg] Stats posted | Servers: ${guildCount} | Shards: ${shardCount}`,
				);
			} catch (error) {
				client.logger.error("[Top.gg] Failed to post stats:", error);
			}
		}
	},
});
