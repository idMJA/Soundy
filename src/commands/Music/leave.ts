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
	name: "leave",
	description: "Make the bot leave the voice channel",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.leave.name", "cmd.leave.description")
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel"])
export default class LeaveCommand extends Command {
	async run(ctx: CommandContext) {
		const { client } = ctx;

		const { cmd } = await ctx.getLocale();

		const guild = await ctx.guild();
		if (!guild) return;

		const player = client.manager.getPlayer(guild.id);
		if (!player) return;

		// Destroy the player and disconnect from voice channel
		await player.destroy();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.yes} ${cmd.leave.run.title}`,
					description: cmd.leave.run.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
