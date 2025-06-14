import { type CommandContext, Declare, LocalesT, SubCommand } from "seyfert";

@Declare({
	name: "delete",
	description: "Delete the music request channel",
})
@LocalesT("cmd.setup.sub.delete.name", "cmd.setup.sub.delete.description")
export default class DeleteSubcommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const setupData = await client.database.getSetup(guildId);

		if (!setupData) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.setup.sub.delete.run.exists}`,
					},
				],
			});
			return;
		}

		try {
			const guild = await ctx.guild();
			if (!guild) return;

			const channel = await guild.channels.fetch(setupData.channelId);
			if (channel) {
				await channel.delete();
			}

			await client.database.deleteSetup(guildId);

			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${cmd.setup.sub.delete.run.success}`,
					},
				],
			});
		} catch {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.setup.sub.delete.run.failed}`,
					},
				],
			});
		}
	}
}
