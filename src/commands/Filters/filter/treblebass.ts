import { type CommandContext, Declare, Middlewares, SubCommand } from "seyfert";

@Declare({
	name: "treblebass",
	description: "Enhance treble and bass frequencies in the music",
})
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class TreblebassFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.setEQ([
				{ band: 0, gain: 0.6 },
				{ band: 1, gain: 0.67 },
				{ band: 2, gain: 0.67 },
				{ band: 3, gain: 0 },
				{ band: 4, gain: -0.5 },
				{ band: 5, gain: 0.15 },
				{ band: 6, gain: -0.45 },
				{ band: 7, gain: 0.23 },
				{ band: 8, gain: 0.35 },
				{ band: 9, gain: 0.45 },
				{ band: 10, gain: 0.55 },
				{ band: 11, gain: 0.6 },
				{ band: 12, gain: 0.55 },
				{ band: 13, gain: 0 },
			]);

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.run.success({ filter: cmd.filter.sub.treblebass.filter })}`,
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
