import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";

@Declare({
	name: "bassboost",
	description: "Enhance bass frequencies in the music",
})
@LocalesT(
	"cmd.filter.sub.bassboost.name",
	"cmd.filter.sub.bassboost.description",
)
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class BassboostFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.setEQ([
				{ band: 0, gain: 0.6 },
				{ band: 1, gain: 0.7 },
				{ band: 2, gain: 0.8 },
				{ band: 3, gain: 0.55 },
			]);

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.run.success({ filter: cmd.filter.sub.bassboost.filter })}`,
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
