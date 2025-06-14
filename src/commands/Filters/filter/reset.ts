import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";

@Declare({
	name: "reset",
	description: "Reset all audio filters",
})
@LocalesT("cmd.filter.sub.reset.name", "cmd.filter.sub.reset.description")
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class ResetFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.resetFilters();

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.reset.run.success}`,
						color: client.config.color.primary,
					},
				],
			});
		} catch {
			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.no} ${cmd.filter.sub.reset.run.error}`,
						color: client.config.color.no,
					},
				],
			});
		}
	}
}
