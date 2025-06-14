import {
	type CommandContext,
	Declare,
	Options,
	SubCommand,
	createStringOption,
	createUserOption,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

const options = {
	user: createUserOption({
		description: "The user to remove premium status from (select from list)",
		required: false,
	}),
	user_id: createStringOption({
		description: "The user ID or mention to remove premium status from",
		required: false,
	}),
};

@Declare({
	name: "remove",
	description: "Remove premium status from a user",
})
@Options(options)
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
export default class RemovePremiumCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>): Promise<void> {
		const { user, user_id } = ctx.options;

		if (!(user || user_id)) {
			await ctx.editOrReply({
				embeds: [
					{
						description: "Please provide either a user or user ID/mention",
						color: EmbedColors.Red,
					},
				],
			});
			return;
		}

		try {
			// If user_id is provided, clean up mention format and fetch user
			const targetId = user_id
				? user_id.replace(/[<@!>]/g, "")
				: user
					? user.id
					: undefined;

			if (!targetId) {
				await ctx.editOrReply({
					embeds: [
						{
							description: "Could not determine the target user ID.",
							color: EmbedColors.Red,
						},
					],
				});
				return;
			}
			const targetUser = user_id
				? await ctx.client.users.fetch(targetId)
				: user;

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

			// Check if the user has premium status before removing
			const premiumStatus = await ctx.client.database.getPremiumStatus(
				targetUser.id,
			);

			if (!premiumStatus) {
				await ctx.editOrReply({
					embeds: [
						{
							description: `${targetUser.username} does not have an active premium status`,
							color: EmbedColors.Yellow,
						},
					],
				});
				return;
			}

			// Remove the premium status
			await ctx.client.database.clearPremiumData(targetUser.id);

			await ctx.editOrReply({
				embeds: [
					{
						description: `Successfully removed premium status from ${targetUser.username}`,
						color: EmbedColors.Green,
					},
				],
			});
		} catch (error) {
			await ctx.editOrReply({
				embeds: [
					{
						description: `Failed to remove premium status: ${error instanceof Error ? error.message : "Unknown error"}`,
						color: EmbedColors.Red,
					},
				],
			});
		}
	}
}
