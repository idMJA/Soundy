import {
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { EmbedPaginator } from "#soundy/utils";

@Declare({
	name: "list",
	description: "List all your playlists",
})
@LocalesT("cmd.playlist.sub.list.name", "cmd.playlist.sub.list.description")
@Middlewares(["checkNodes"])
export default class ListPlaylistCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const userId = author.id;
		const client = ctx.client;
		const { cmd } = await ctx.getLocale();

		const playlists = await client.database.getPlaylists(userId);

		if (!playlists || playlists.length === 0) {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.list.run.no_playlists}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const playlistsPerPage = 10;
		const pages = Math.ceil(playlists.length / playlistsPerPage);
		const paginator = new EmbedPaginator(ctx);

		// Generate embeds for each page
		for (let page = 0; page < pages; page++) {
			const start = page * playlistsPerPage;
			const end = start + playlistsPerPage;
			const currentPlaylists = playlists.slice(start, end);

			const embed = new Embed()
				.setColor(client.config.color.primary)
				.setAuthor({
					name: cmd.playlist.sub.list.run.title({ author: author.username }),
					iconUrl: author.avatarURL(),
				})
				.setDescription(
					currentPlaylists
						.map(
							(playlist, i) =>
								`${start + i + 1}. ${cmd.playlist.sub.list.run.list({ playlist: `\`${playlist.name}\``, tracks: playlist.tracks.length })}`,
						)
						.join("\n"),
				)
				.setFooter({
					text: cmd.playlist.run.footer({
						page: `${page + 1}/${pages}`,
						total: playlists.length,
					}),
				})
				.setTimestamp();

			paginator.addEmbed(embed);
		}

		await paginator.reply(false);
	}
}
