import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "pause",
	description: "Pause the current track",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.pause.name", "cmd.pause.description")
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		// Check if already paused
		if (player.paused) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.pause.run.paused}`,
						color: client.config.color.no,
					},
				],
			});
		}

		// Pause the player
		await player.pause();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.pause} ${event.music.pause.title}`,
					description: event.music.pause.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
