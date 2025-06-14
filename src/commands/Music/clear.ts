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
	name: "clearqueue",
	description: "Clear the current music queue",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.clearqueue.name", "cmd.clearqueue.description")
@Middlewares([
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class ClearQueueCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;

		const { component } = await ctx.getLocale();

		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		player.queue.tracks.splice(0, player.queue.tracks.length);

		await ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.trash} ${component.clear.description}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
