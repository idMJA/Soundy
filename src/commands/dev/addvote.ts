import {
	Command,
	type CommandContext,
	createStringOption,
	createUserOption,
	Declare,
	Options,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyOptions } from "#soundy/utils";

const options = {
	user: createUserOption({
		description: "The user to add premium vote for (select from list)",
		required: false,
	}),
	user_id: createStringOption({
		description: "The user ID or mention to add premium vote for",
		required: false,
	}),
};

@Declare({
	name: "addvote",
	description: "Manually add premium vote for a user",
	defaultMemberPermissions: ["Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
@Options(options)
export default class AddVoteCommand extends Command {
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
							description: "Could not determine target user ID.",
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

			await ctx.client.database.addUserVote(targetUser.id);

			await ctx.editOrReply({
				embeds: [
					{
						description: `Successfully added premium vote for ${targetUser.username}`,
						color: EmbedColors.Green,
					},
				],
			});
		} catch (error) {
			await ctx.editOrReply({
				embeds: [
					{
						description: `Failed to add premium vote: ${error instanceof Error ? error.message : "Unknown error"}`,
						color: EmbedColors.Red,
					},
				],
			});
		}
	}
}
