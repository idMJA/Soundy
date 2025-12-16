import {
	type CommandContext,
	createStringOption,
	createUserOption,
	Declare,
	Options,
	SubCommand,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyCategory } from "#soundy/types";
import { isUserPremiumStats, SoundyOptions } from "#soundy/utils";

const options = {
	user: createUserOption({
		description: "The user to check premium status for (select from list)",
		required: false,
	}),
	user_id: createStringOption({
		description: "The user ID or mention to check premium status for",
		required: false,
	}),
};

@Declare({
	name: "check",
	description: "Check premium status for a user",
})
@Options(options)
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
export default class CheckPremiumCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>): Promise<void> {
		const { user, user_id } = ctx.options;

		// If no user or ID is provided, check the caller's premium status
		const targetId = user_id
			? user_id.replace(/[<@!>]/g, "")
			: user
				? user.id
				: ctx.author.id;

		try {
			const targetUser = user_id
				? await ctx.client.users.fetch(targetId)
				: user
					? user
					: ctx.author;

			if (!targetUser) {
				await ctx.editOrReply({
					embeds: [
						{
							description: "Could not find user with the provided ID/mention",
							color: EmbedColors.Red,
						},
					],
				});
				return;
			}

			const premiumStatus = await ctx.client.database.getPremiumStatus(
				targetUser.id,
			);
			const premiumStats = await ctx.client.database.getPremiumStats(
				targetUser.id,
			);

			if (
				!(
					premiumStatus ||
					(isUserPremiumStats(premiumStats) && premiumStats.active)
				)
			) {
				await ctx.editOrReply({
					embeds: [
						{
							title: `Premium Status for ${targetUser.username}`,
							description: "User does not have an active premium status",
							color: EmbedColors.Red,
						},
					],
				});
				return;
			}

			// Format remaining time in a readable format
			let formattedTime = "Unknown";
			const premiumType =
				(isUserPremiumStats(premiumStats) ? premiumStats.type : null) ||
				(premiumStatus ? premiumStatus.type : "Unknown");

			if (premiumStatus) {
				const ms = premiumStatus.timeRemaining;

				const days = Math.floor(ms / (24 * 60 * 60 * 1000));
				const hours = Math.floor(
					(ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
				);
				const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

				formattedTime = `${days} days, ${hours} hours, ${minutes} minutes`;
			}

			const expiryDate =
				isUserPremiumStats(premiumStats) && premiumStats.expiresAt
					? premiumStats.expiresAt.toLocaleString()
					: "Unknown";

			await ctx.editOrReply({
				embeds: [
					{
						title: `Premium Status for ${targetUser.username}`,
						description: `**Status:** Active\n**Type:** ${premiumType === "vote" ? "Vote Premium" : "Regular Premium"}\n**Time Remaining:** ${formattedTime}\n**Expires on:** ${expiryDate}`,
						color: EmbedColors.Green,
					},
				],
			});
		} catch (error) {
			await ctx.editOrReply({
				embeds: [
					{
						description: `Failed to check premium status: ${error instanceof Error ? error.message : "Unknown error"}`,
						color: EmbedColors.Red,
					},
				],
			});
		}
	}
}
