import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	type User,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions, TimeFormat, getSourceIcon } from "#soundy/utils";

@Declare({
	name: "nowplaying",
	description: "Get the current playing song",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["np"],
})
@LocalesT("cmd.nowplaying.name", "cmd.nowplaying.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Middlewares(["checkNodes", "checkPlayer"])
export default class NowPlayingCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const track = player.queue.current;
		if (!track) return;

		const duration = track.info.isStream
			? "LIVE"
			: TimeFormat.toDotted(track.info.duration);
		const position = TimeFormat.toDotted(player.position);

		await ctx.editOrReply({
			embeds: [
				{
					author: {
						name: `${cmd.nowplaying.run.now_playing}`,
						icon_url: getSourceIcon(track.info.sourceName),
					},
					thumbnail: { url: track.info.artworkUrl ?? "" },
					description: `## [${track.info.title}](${track.info.uri})`,
					fields: [
						{
							name: `${client.config.emoji.artist} ${event.music.artist}`,
							value: `\`${track.info.author}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.clock} ${event.music.duration}`,
							value: `\`${position} / ${duration}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by}`,
							value: `<@${(track.requester as User).id}>`,
							inline: true,
						},
					],
					color: client.config.color.primary,
					footer: {
						text: cmd.requested_by({ user: ctx.author.username }),
						icon_url: ctx.author.avatarURL(),
					},
					timestamp: new Date().toISOString(),
				},
			],
		});
	}
}
