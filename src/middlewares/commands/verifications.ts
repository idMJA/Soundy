import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

export const checkVerifications = createMiddleware<void>(
	async ({ context, next, pass }) => {
		const { client, author, member, command } = context;
		const { developersIds } = client.config;

		const { event } = await context.getLocale();

		const guild = await context.guild();

		if (!(member && command && guild)) return pass();

		if (
			"onlyDeveloper" in command &&
			command.onlyDeveloper &&
			!developersIds.includes(author.id)
		) {
			await context.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.no} ${event.verifications.only_developer}`,
						color: client.config.color.no,
					},
				],
			});

			return pass();
		}

		if (
			"onlyGuildOwner" in command &&
			command.onlyGuildOwner &&
			member.id !== guild.ownerId
		) {
			await context.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.no} ${event.verifications.only_guild_owner}`,
						color: client.config.color.no,
					},
				],
			});

			return pass();
		}

		// Only run cooldown for commands, skip for components
		if (context.isComponent?.()) return await next();

		return next();
	},
);
