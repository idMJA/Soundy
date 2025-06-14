import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";

@Declare({
	name: "pop",
	description: "Apply pop equalizer preset to the music",
})
@LocalesT("cmd.filter.sub.pop.name", "cmd.filter.sub.pop.description")
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class PopFilterCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		try {
			await player.filterManager.setEQ([
				{ band: 0, gain: -0.25 },
				{ band: 1, gain: 0.48 },
				{ band: 2, gain: 0.59 },
				{ band: 3, gain: 0.72 },
				{ band: 4, gain: 0.56 },
				{ band: 5, gain: 0.15 },
				{ band: 6, gain: -0.24 },
				{ band: 7, gain: -0.24 },
				{ band: 8, gain: -0.16 },
				{ band: 9, gain: -0.16 },
				{ band: 10, gain: 0 },
				{ band: 11, gain: 0 },
				{ band: 12, gain: 0 },
				{ band: 13, gain: 0 },
			]);

			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.filter.sub.run.success({ filter: cmd.filter.sub.pop.filter })}`,
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
