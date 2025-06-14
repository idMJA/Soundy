import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

/**
 * Check if the bot is in a voice channel and if is the same as the author.
 */
export const checkBotVoiceChannel = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const me = await context.me();
			if (!me) return pass();

			const state = context.client.cache.voiceStates?.get(
				context.author.id,
				context.guildId ?? "",
			);
			if (!state) return pass();

			const { event } = await context.getLocale();
			const config = context.client.config;

			const bot = context.client.cache.voiceStates?.get(
				me.id,
				context.guildId ?? "",
			);

			if (bot && bot.channelId !== state.channelId) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${config.emoji.no} ${event.voice.no_same({ channel: `<#${bot.channelId}>` })}`,
							color: config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkBotVoiceChannel] ${error}`);
			return pass();
		}
	},
);

/**
 * Check if the author is in a voice channel.
 */
export const checkVoiceChannel = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const state = context.client.cache.voiceStates?.get(
				context.author.id,
				context.guildId ?? "",
			);
			const channel = await state?.channel().catch(() => null);

			const { event } = await context.getLocale();
			const config = context.client.config;

			if (!channel?.is(["GuildVoice", "GuildStageVoice"])) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${config.emoji.no} ${event.voice.no_vc}`,
							color: config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkVoiceChannel] ${error}`);
			return pass();
		}
	},
);

/**
 * Check if the bot has permissions to join the voice channel.
 */
export const checkVoicePermissions = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const state = context.client.cache.voiceStates?.get(
				context.author.id,
				context.guildId ?? "",
			);
			if (!state) return pass();

			const channel = await state.channel().catch(() => null);
			if (!channel?.is(["GuildVoice", "GuildStageVoice"])) return pass();

			const { stagePermissions, voicePermissions } =
				context.client.config.permissions;

			const me = await context.me();
			if (!me) return pass();

			const { event } = await context.getLocale();
			const config = context.client.config;

			const permissions = await context.client.channels.memberPermissions(
				channel.id,
				me,
			);
			const missings = permissions.keys(
				permissions.missings(
					channel.isStage() ? stagePermissions : voicePermissions,
				),
			);

			if (missings.length) {
				await context.editOrReply({
					content: "",
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${config.emoji.no} ${event.voice.no_perms({ channel: `<#${channel.id}>` })}`,
							color: config.color.no,
							fields: [
								{
									name: event.voice.missing_perms,
									value: missings.map((p) => `- ${p}`).join("\n"),
								},
							],
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(
				`[Middleware checkVoicePermissions] ${error}`,
			);
			return pass();
		}
	},
);
