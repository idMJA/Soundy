import {
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	Middlewares,
	Options,
	SubCommand,
	createStringOption,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const option = {
	name: createStringOption({
		description: "The name of the playlist",
		required: true,
		locales: {
			name: "cmd.playlist.sub.load.options.name.name",
			description: "cmd.playlist.sub.load.options.name.description",
		},
	}),
};

@Declare({
	name: "load",
	description: "Load and play a playlist",
})
@LocalesT("cmd.playlist.sub.load.name", "cmd.playlist.sub.load.description")
@Options(option)
@Middlewares(["checkNodes", "checkVoiceChannel"])
export default class LoadPlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, guildId, options } = ctx;
		const userId = ctx.author.id;
		const voiceState = await ctx.member?.voice("cache");
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		if (!voiceState?.channelId) return;

		const tracks = await client.database.getTracksFromPlaylist(
			userId,
			options.name,
		);

		if (!tracks || tracks.length === 0) {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.run.not_found}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const { defaultVolume } = await client.database.getPlayer(guildId);

		// Get or create player
		let player = client.manager.players.get(guildId);
		if (!player) {
			player = client.manager.createPlayer({
				guildId: guildId,
				voiceChannelId: voiceState.channelId,
				textChannelId: ctx.channelId,
				volume: defaultVolume,
				selfDeaf: true,
			});
			await player.connect();
		}

		// Load and add tracks
		for (const trackUrl of tracks) {
			const result = await client.manager.search(trackUrl.url);
			if (result.tracks[0]) {
				player.queue.add(result.tracks[0]);
			}
		}

		await ctx.editOrReply({
			embeds: [
				new Embed()
					.setColor(client.config.color.primary)
					.setDescription(
						`${client.config.emoji.yes} ${cmd.playlist.sub.load.run.loaded({ tracks: tracks.length, playlist: `**${options.name}**` })}`,
					)
					.setFooter({
						text: cmd.requested_by({ user: ctx.author.username }),
					})
					.setTimestamp(),
			],
		});

		if (!(player.playing || player.paused)) {
			await player.play();
		}
	}
}
