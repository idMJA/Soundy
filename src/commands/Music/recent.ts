import {
	Command,
	type CommandContext,
	Declare,
	Embed,
	Middlewares,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { TimeFormat } from "#soundy/utils";

@Declare({
	name: "recent",
	description: "Show the 10 most recently played tracks",
})
@Middlewares(["checkNodes"])
export default class RecentlyPlayedCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		const user = ctx.author;
		const userId = user.id;
		const guildId = await ctx.guild();

		try {
			const recentTracks = await client.database.getRecentlyPlayed(
				userId,
				guildId?.id,
				10,
			);

			if (!recentTracks || recentTracks.length === 0) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.primary,
							title: `${client.config.emoji.clock} Recently Played Tracks`,
							description: `${client.config.emoji.info} No recently played tracks found for this user.\n\n${client.config.emoji.music} Start playing some music to see your recent tracks here!`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const embed = new Embed()
				.setColor(client.config.color.primary)
				.setTitle(`${client.config.emoji.clock} Recently Played Tracks`)
				.setDescription(
					recentTracks
						.map((track, i) => {
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
							return `${i + 1}. **[${title}](${track.uri})** by \`${author}\`\n┗ \`${duration}\` • <t:${Math.floor(new Date(track.playedAt).getTime() / 1000)}:R>`;
						})
						.join("\n\n"),
				)
				.setFooter({
					text: `Requested by ${user.username}`,
				})
				.setTimestamp();

			await ctx.editOrReply({ embeds: [embed] });
		} catch (error) {
			console.error("Error fetching recently played:", error);
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						title: `${client.config.emoji.no} Error`,
						description: `An error occurred while fetching recently played tracks.`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
