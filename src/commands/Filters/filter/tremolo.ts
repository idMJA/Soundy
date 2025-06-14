import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";

@Declare({
	name: "tremolo",
	description: "Apply tremolo effect to the music",
})
@LocalesT("cmd.filter.sub.tremolo.name", "cmd.filter.sub.tremolo.description")
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class TremoloFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.toggleTremolo(2.0, 0.5);

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.run.success({ filter: cmd.filter.sub.tremolo.filter })}`,
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
