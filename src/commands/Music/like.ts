import {
	Command,
	type CommandContext,
	Declare,
	Embed,
	Middlewares,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

@Declare({
	name: "like",
	description: "Like or unlike the currently playing track",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel"])
export default class LikeCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client, guildId } = ctx;
		const user = ctx.author;
		const userId = user.id;

		const { event } = await ctx.getLocale();

		if (!guildId) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} This command can only be used in a server.`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			const player = client.manager.players.get(guildId);
			if (!player?.queue.current) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} No track is currently playing.`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const track = player.queue.current;
			const trackId = track.encoded || track.info.identifier;
			const title = track.info.title;
			const author = track.info.author;
			const uri = track.info.uri;
			const artwork = track.info.artworkUrl || undefined;
			const length = track.info.duration;
			const isStream = track.info.isStream;

			// Check if already liked
			const isLiked = await client.database.isTrackLiked(userId, trackId);

			if (isLiked) {
				// Unlike the track
				const success = await client.database.removeFromLikedSongs(
					userId,
					trackId,
				);
				if (success) {
					const embed = new Embed()
						.setColor(client.config.color.primary)
						.setTitle(`${client.config.emoji.heart} Removed from Liked Songs`)
						.setDescription(
							`**Removed from your liked songs**\n\n${client.config.emoji.music} **[${title}](${uri})**\n${client.config.emoji.artist} \`${author}\``,
						)
						.setTimestamp();
					if (artwork) {
						embed.setThumbnail(artwork);
					}
					await ctx.editOrReply({ embeds: [embed] });
				} else {
					await ctx.editOrReply({
						embeds: [
							{
								color: client.config.color.no,
								description: `${client.config.emoji.no} Failed to remove track from liked songs.`,
							},
						],
						flags: MessageFlags.Ephemeral,
					});
				}
			} else {
				// Like the track
				const success = await client.database.addToLikedSongs(
					userId,
					trackId,
					title,
					author,
					uri,
					artwork,
					length,
					isStream,
				);
				if (success) {
					const embed = new Embed()
						.setColor(client.config.color.primary)
						.setTitle(`${client.config.emoji.heart} Added to Liked Songs`)
						.setDescription(
							`${client.config.emoji.music} **[${title}](${uri})**\n${client.config.emoji.artist} ${event.music.artist} \`${author}\``,
						)
						.setTimestamp();
					if (artwork) {
						embed.setThumbnail(artwork);
					}
					await ctx.editOrReply({ embeds: [embed] });
				} else {
					await ctx.editOrReply({
						embeds: [
							{
								color: client.config.color.no,
								description: `${client.config.emoji.no} This track is already in your liked songs.`,
							},
						],
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} catch (error) {
			console.error("Error in like command:", error);
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} An error occurred while processing your request.`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
