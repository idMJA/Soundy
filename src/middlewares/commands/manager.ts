import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

/**
 * Check if the bot is connected to any lavalink node.
 */
export const checkNodes = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const { client } = context;

			const { event } = await context.getLocale();

			if (!client.manager.useable) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${client.config.emoji.no} ${event.manager.no_nodes}`,
							color: client.config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkNodes] ${error}`);
			return pass();
		}
	},
);

/**
 * Check if the player exists.
 */
export const checkPlayer = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const { client } = context;

			const { event } = await context.getLocale();

			if (!context.guildId) return pass();

			const player = client.manager.getPlayer(context.guildId);
			if (!player) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${client.config.emoji.no} ${event.manager.no_player}`,
							color: client.config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkPlayer] ${error}`);
			return pass();
		}
	},
);

/**
 * Check if the queue has tracks.
 */
export const checkQueue = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const { client } = context;

			const { event } = await context.getLocale();

			if (!context.guildId) return pass();

			const player = client.manager.getPlayer(context.guildId);
			if (!player) return pass();

			const isAutoplay = !!player.get<boolean | undefined>("enabledAutoplay");
			if (isAutoplay) {
				return next();
			}
			if (!player?.queue.tracks.length) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${client.config.emoji.no} ${event.manager.no_tracks}`,
							color: client.config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkQueue] ${error}`);
			return pass();
		}
	},
);

/**
 * Check if the queue has more than one track.
 */
export const checkTracks = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const { client } = context;

			const { event } = await context.getLocale();

			if (!context.guildId) return pass();

			const player = client.manager.getPlayer(context.guildId);
			if (!player) return pass();

			if (!(player.queue.tracks.length + Number(!!player.queue.current) >= 1)) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${client.config.emoji.no} ${event.manager.not_enough}`,
							color: client.config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkTracks] ${error}`);
			return pass();
		}
	},
);
