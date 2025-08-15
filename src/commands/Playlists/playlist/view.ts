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
import { EmbedPaginator, TimeFormat } from "#soundy/utils";

const option = {
	name: createStringOption({
		description: "The playlist to view",
		required: true,
		locales: {
			name: "cmd.playlist.sub.view.options.name.name",
			description: "cmd.playlist.sub.view.options.name.description",
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
	name: "view",
	description: "View tracks in a playlist",
})
@LocalesT("cmd.playlist.sub.view.name", "cmd.playlist.sub.view.description")
@Options(option)
@Middlewares(["checkNodes"])
export default class ViewPlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const { cmd } = await ctx.getLocale();

		const playlist = await client.database.getPlaylistById(options.name);
		if (!playlist) {
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
		const tracks = playlist.tracks;

		if (!tracks || tracks.length === 0) {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.view.run.empty}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const tracksPerPage = 10;
		const pages = Math.ceil(tracks.length / tracksPerPage);
		const paginator = new EmbedPaginator(ctx);

		// Get tracks with stored info
		const trackDetails = tracks
			.map((track) => {
				if (track.info) {
					// Use stored info
					return {
						info:
							typeof track.info === "string"
								? JSON.parse(track.info)
								: track.info,
					};
				} else {
					// Fallback: search for track info
					return null;
				}
			})
			.filter(Boolean);

		for (let page = 0; page < pages; page++) {
			const start = page * tracksPerPage;
			const end = start + tracksPerPage;
			const currentTracks = trackDetails.slice(start, end);

			const embed = new Embed()
				.setColor(client.config.color.primary)
				.setAuthor({
					name: cmd.playlist.sub.view.run.title({ name: playlist.name }),
					iconUrl: ctx.author.avatarURL(),
				})
				.setDescription(
					currentTracks
						.map((track, i) => {
							if (!track || !track.info)
								return `${start + i + 1}. ${cmd.playlist.sub.view.run.failed}`;
							const duration = track.info.isStream
								? "LIVE"
								: TimeFormat.toDotted(track.info.length);
							const title =
								track.info.title.length > 45
									? `${track.info.title.slice(0, 42)}...`
									: track.info.title;
							const author =
								track.info.author.length > 35
									? `${track.info.author.slice(0, 32)}...`
									: track.info.author;
							return `${start + i + 1}. **[${title}](${track.info.uri})** by \`${author}\`\n┗ \`${duration}\``;
						})
						.join("\n\n"),
				)
				.setFooter({
					text: cmd.playlist.run.footer({
						page: `${page + 1}/${pages}`,
						total: tracks.length,
					}),
				})
				.setTimestamp();

			paginator.addEmbed(embed);
		}

		await paginator.reply(false);
	}
}
