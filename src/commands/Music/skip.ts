import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "skip",
	description: "Skip the current track",
})
@LocalesT("cmd.skip.name", "cmd.skip.description")
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@Middlewares([
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class SkipCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();
		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const isAutoplay = player.get("enabledAutoplay");
		const hasNextTrack = player.queue.tracks.length > 0;

		await player.skip(undefined, !isAutoplay);

		let description = "";
		if (hasNextTrack) {
			description += component.skip.description;
		} else if (isAutoplay) {
			description += component.skip.autoplay;
		} else {
			description += component.skip.end;
		}

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.skip} ${component.skip.title}`,
					description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
