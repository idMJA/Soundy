import {
	type CommandContext,
	createStringOption,
	Declare,
	Options,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";
import {
	isGlobalPremiumStats,
	isUserPremiumStats,
	SoundyOptions,
} from "#soundy/utils";

const options = {
	type: createStringOption({
		description: "Type of data to view",
		required: true,
		choices: [
			{ name: "Votes", value: "votes" },
			{ name: "Playlists", value: "playlists" },
			{ name: "Premium", value: "premium" },
			{ name: "Stats", value: "stats" },
			{ name: "All", value: "all" },
		],
	}),
	user_id: createStringOption({
		description: "User ID or mention",
		required: true,
	}),
};

@Declare({
	name: "view",
	description: "View database statistics",
})
@Options(options)
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
export default class ViewDatabaseCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { client } = ctx;
		const type = ctx.options.type;
		// Clean up user ID from mention format if present
		const userId = ctx.options.user_id.replace(/[<@!>]/g, "");
		const startTime = Date.now();
		const stats: string[] = [];

		try {
			switch (type) {
				case "votes": {
					const voteStats = await client.database.getVoteStats(userId);
					if (userId) {
						stats.push(`Active Votes: ${voteStats.total}`);
						stats.push(`Active Premium from Votes: ${voteStats.active}`);
					} else {
						stats.push(`Total Votes: ${voteStats.total}`);
						stats.push(`Active Premium Users: ${voteStats.active}`);
					}
					break;
				}

				case "playlists": {
					const playlistStats = await client.database.getPlaylistStats(userId);
					if (userId) {
						stats.push(`Total Playlists: ${playlistStats.playlists}`);
						stats.push(`Total Tracks: ${playlistStats.tracks}`);
					} else {
						stats.push(`Total Playlists: ${playlistStats.playlists}`);
						stats.push(`Total Tracks: ${playlistStats.tracks}`);
					}
					break;
				}

				case "premium": {
					if (userId) {
						const userStats = await client.database.getPremiumStats(userId);
						if (isUserPremiumStats(userStats) && userStats.active) {
							stats.push("Premium Status: Active");
							stats.push(
								`Expires At: ${userStats.expiresAt?.toLocaleString()}`,
							);
						} else {
							stats.push("Premium Status: Inactive");
						}
					} else {
						const globalStats = await client.database.getPremiumStats();
						if (isGlobalPremiumStats(globalStats)) {
							stats.push(
								`Active Premium Users: ${globalStats.totalActiveUsers}`,
							);
							stats.push(
								`- Regular Premium: ${globalStats.activeRegularUsers}`,
							);
							stats.push(`- Vote Premium: ${globalStats.activeVoteUsers}`);
						}
					}
					break;
				}
				case "stats": {
					const generalStats = await client.database.getGeneralStats();
					stats.push(`Track Statistics Records: ${generalStats.trackStats}`);
					stats.push(`User Statistics Records: ${generalStats.userStats}`);
					break;
				}

				case "all": {
					if (userId) {
						const [voteStats, playlistStats, generalStats] = await Promise.all([
							client.database.getVoteStats(userId),
							client.database.getPlaylistStats(userId),
							client.database.getGeneralStats(),
						]);
						stats.push(`Total Votes: ${voteStats.total}`);
						stats.push(`Total Playlists: ${playlistStats.playlists}`);
						stats.push(`Total Tracks: ${playlistStats.tracks}`);
						stats.push(`User Statistics Records: ${generalStats.userStats}`);
					} else {
						const [voteStats, playlistStats, generalStats] = await Promise.all([
							client.database.getVoteStats(),
							client.database.getPlaylistStats(),
							client.database.getGeneralStats(),
						]);
						stats.push(`Total Votes: ${voteStats.total}`);
						stats.push(`Total Playlists: ${playlistStats.playlists}`);
						stats.push(`Total Tracks: ${playlistStats.tracks}`);
						stats.push(`Track Statistics Records: ${generalStats.trackStats}`);
						stats.push(`User Statistics Records: ${generalStats.userStats}`);
					}
					break;
				}
			}

			const timeTaken = Date.now() - startTime;
			await ctx.editOrReply({
				embeds: [
					{
						title: "📊 Database Statistics",
						description: stats.join("\n"),
						footer: { text: `Query completed in ${timeTaken}ms` },
						color: client.config.color.primary,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			client.logger.error("Database view error:", error);
			await ctx.editOrReply({
				embeds: [
					{
						description:
							"❌ An error occurred while fetching database statistics",
						color: client.config.color.no,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
