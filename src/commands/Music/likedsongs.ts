import {
	Command,
	type CommandContext,
	Declare,
	Embed,
	Middlewares,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { TimeFormat, EmbedPaginator } from "#soundy/utils";

@Declare({
	name: "likedsongs",
	description: "Show your liked songs",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@Middlewares(["checkNodes"])
export default class LikedSongsCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		const user = ctx.author;
		const userId = user.id;

		try {
			const likedSongs = await client.database.getLikedSongs(userId);
			const totalCount = await client.database.getLikedSongsCount(userId);

			if (!likedSongs || likedSongs.length === 0) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.primary,
							description: `${client.config.emoji.no} You don't have any liked songs yet.\n\nUse \`/like\` while a track is playing to add it to your liked songs.`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const paginator = new EmbedPaginator(ctx);
			const tracksPerPage = 5;

			for (let i = 0; i < likedSongs.length; i += tracksPerPage) {
				const pageTracks = likedSongs.slice(i, i + tracksPerPage);
				const embed = new Embed()
					.setColor(client.config.color.primary)
					.setAuthor({
						name: "Your Liked Songs",
						iconUrl: user.avatarURL(),
					})
					.setDescription(
						pageTracks
							.map((track, idx) => {
								const duration = track.isStream
									? "LIVE"
									: track.length
									? TimeFormat.toDotted(track.length)
									: "Unknown";
								const title =
									track.title.length > 45
										? `${track.title.slice(0, 42)}...`
										: track.title;
								const author =
									track.author.length > 35
										? `${track.author.slice(0, 32)}...`
										: track.author;
								return `${i + idx + 1}. **[${title}](${track.uri})** by \`${author}\`\n┗ \`${duration}\` • <t:${Math.floor(new Date(track.likedAt).getTime() / 1000)}:R>`;
							})
							.join("\n\n")
					)
					.setFooter({
						text: `Page ${Math.floor(i / tracksPerPage) + 1} • Showing ${i + 1}-${Math.min(
							i + tracksPerPage,
							likedSongs.length
						)} of ${totalCount} liked songs`,
					})
					.setTimestamp();

				if (pageTracks.length > 0 && pageTracks[0]?.artwork) {
					embed.setThumbnail(pageTracks[0].artwork);
				}

				paginator.addEmbed(embed);
			}

			await paginator.reply();
		} catch (error) {
			console.error("Error fetching liked songs:", error);
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} An error occurred while fetching your liked songs.`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
