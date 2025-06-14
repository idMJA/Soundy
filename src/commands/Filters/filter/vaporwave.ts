import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";

@Declare({
	name: "vaporwave",
	description: "Apply vaporwave effect to the music",
})
@LocalesT(
	"cmd.filter.sub.vaporwave.name",
	"cmd.filter.sub.vaporwave.description",
)
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class VaporwaveFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.toggleVaporwave();

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.run.success({ filter: cmd.filter.sub.vaporwave.filter })}`,
						color: client.config.color.primary,
					},
				],
			});
		} catch {
			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.no} ${cmd.filter.sub.run.error}`,
						color: client.config.color.no,
					},
				],
			});
		}
	}
}
