import {
	AttachmentBuilder,
	Command,
	type CommandContext,
	createUserOption,
	Declare,
	LocalesT,
	Options,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { generateProfileCard, SoundyOptions } from "#soundy/utils";

const options = {
	user: createUserOption({
		description: "The user to view music profile for",
		required: false,
		locales: {
			name: "cmd.profile.options.user.name",
			description: "cmd.profile.options.user.description",
		},
	}),
};

@Declare({
	name: "profile",
	description:
		"View your or another user's music streaming profile & statistics",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@Options(options)
@LocalesT("cmd.profile.name", "cmd.profile.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Informations })
export default class ProfileCommand extends Command {
	async run(ctx: CommandContext<typeof options>): Promise<void> {
		const { client } = ctx;
		const targetUser = ctx.options.user ?? ctx.author;

		await ctx.deferReply();

		try {
			const stats = await client.database.getUserProfileStats(targetUser.id);

			const enrichedServers = await Promise.all(
				stats.topServers.map(async (s) => {
					const guild =
						client.cache.guilds?.get(s.guildId) ??
						(await client.guilds.fetch(s.guildId).catch(() => null));
					return {
						name: guild?.name ?? `Server (${s.guildId.slice(0, 4)}...)`,
						iconUrl: guild ? (guild.iconURL() ?? null) : null,
						playCount: s.playCount,
					};
				}),
			);

			const enrichedFriends = await Promise.all(
				stats.topFriends.map(async (f) => {
					const user =
						client.cache.users?.get(f.friendId) ??
						(await client.users.fetch(f.friendId).catch(() => null));
					return {
						username:
							user?.globalName ??
							user?.username ??
							`User (${f.friendId.slice(0, 4)}...)`,
						avatarUrl: user ? (user.avatarURL() ?? null) : null,
						timeMs: f.timeMs,
						listenCount: f.listenCount,
					};
				}),
			);

			const cardBuffer = await generateProfileCard({
				user: {
					id: targetUser.id,
					username: targetUser.username,
					displayName:
						(targetUser as { globalName?: string }).globalName ??
						targetUser.username,
					avatarUrl: targetUser.avatarURL(),
				},
				totalSongs: stats.totalSongs,
				songRank: stats.songRank,
				totalTimeMs: stats.totalTimeMs,
				timeRank: stats.timeRank,
				totalVotes: stats.totalVotes,
				isPremium: stats.isPremium,
				topServers: enrichedServers,
				topFriends: enrichedFriends,
				topTracks: stats.topTracks,
			});

			const attachment = new AttachmentBuilder()
				.setFile("buffer", cardBuffer)
				.setName(`profile-${targetUser.id}.png`);

			await ctx.editOrReply({
				files: [attachment],
			});
		} catch (error) {
			client.logger.error("Failed to generate profile card:", error);
			await ctx.editOrReply({
				content: "Failed to generate profile card. Please try again later.",
			});
		}
	}
}
