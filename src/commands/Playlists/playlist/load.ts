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
		description: "The playlist to load",
		required: true,
		locales: {
			name: "cmd.playlist.sub.load.options.name.name",
			description: "cmd.playlist.sub.load.options.name.description",
		},
		autocomplete: async (interaction) => {
			const { client, member } = interaction;
			if (!member) return;
			const playlists = await client.database.getPlaylists(member.id);
			if (!playlists.length) {
				return interaction.respond([
					{ name: "No playlists found", value: "noPlaylists" },
				]);
			}
			return interaction.respond(
				playlists
					.slice(0, 25)
					.map((playlist) => ({ name: playlist.name, value: playlist.id })),
			);
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
		const voiceState = ctx.member?.voice("cache");
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		if (!voiceState?.channelId) return;

		const playlist = await client.database.getPlaylistById(options.name);
		const tracks = playlist
			? playlist.tracks.map((track) => ({
					url: track.url,
					info: track.info ? JSON.parse(track.info) : null,
				}))
			: null;

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
						`${client.config.emoji.yes} ${cmd.playlist.sub.load.run.loaded({ tracks: tracks.length, playlist: `**${playlist?.name || options.name}**` })}`,
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
