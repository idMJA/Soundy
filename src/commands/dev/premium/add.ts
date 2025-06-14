import {
	type CommandContext,
	Declare,
	Options,
	SubCommand,
	createIntegerOption,
	createStringOption,
	createUserOption,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

const option = {
	user: createUserOption({
		description: "The user to add premium status for (select from list)",
		required: false,
	}),
	user_id: createStringOption({
		description: "The user ID or mention to add premium status for",
		required: false,
	}),
	duration: createIntegerOption({
		description: "Duration in days (default: 30)",
		required: false,
		min_value: 1,
		max_value: 365,
	}),
};

@Declare({
	name: "add",
	description: "Add premium status for a user",
})
@Options(option)
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
export default class AddPremiumCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;

		const { user, user_id, duration } = options;
		const durationDays = duration || 30; // Default to 30 days if not specified

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
			// Calculate duration in milliseconds (days to ms)
			const durationMs = durationDays * 24 * 60 * 60 * 1000;

			await client.database.addPremium(targetUser.id, "regular", durationMs); // untuk regular

			const expiryDate = new Date(Date.now() + durationMs);

			await ctx.editOrReply({
				embeds: [
					{
						description: `Successfully added premium status for ${targetUser.username} for ${durationDays} days\nExpires on: ${expiryDate.toLocaleString()}`,
						color: EmbedColors.Green,
					},
				],
			});
		} catch (error) {
			console.error(
				"Error adding premium:",
				error instanceof Error ? error.message : error,
			);

			await ctx.editOrReply({
				embeds: [
					{
						description: `Failed to add premium status: ${error instanceof Error ? error.message : "Unknown error"}\n\nPlease run \`/migratevotes\` command to fix database structure.`,
						color: EmbedColors.Red,
					},
				],
			});
		}
	}

	// Contoh penggunaan addPremium di command
	// await database.addPremium(userId, 'regular', durationMs); // untuk regular
	// await database.addPremium(userId, 'vote'); // untuk vote
}
