import {
	Command,
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	Middlewares,
	type User,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions, TimeFormat } from "#soundy/utils";

@Declare({
	name: "replay",
	description: "Replay the current track from the beginning",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.replay.name", "cmd.replay.description")
@SoundyOptions({ cooldown: 3, category: SoundyCategory.Music })
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class ReplayCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const player = client.manager.players.get(guildId);
		if (!player) return;

		const currentTrack = player.queue.current;
		if (!currentTrack) return;

		// Replay the current track from the beginning
		await player.play();

		await ctx.editOrReply({
			embeds: [
				new Embed()
					.setTitle(`${client.config.emoji.play} ${cmd.replay.run.title}`)
					.setThumbnail(currentTrack.info.artworkUrl ?? undefined)
					.setDescription(
						`**[${currentTrack.info.title}](${currentTrack.info.uri})**`,
					)
					.addFields(
						{
							name: `${client.config.emoji.artist} ${event.music.artist}`,
							value: `\`${currentTrack.info.author}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.clock} ${event.music.duration}`,
							value: `\`${currentTrack.info.isStream ? "LIVE" : (TimeFormat.toDotted(currentTrack.info.duration) ?? "Unknown")}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by}`,
							value: `<@${(currentTrack.requester as User).id}>`,
							inline: true,
						},
					)
					.setColor(client.config.color.primary)
					.setTimestamp(),
			],
		});
	}
}
