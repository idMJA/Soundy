import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	Options,
	SubCommand,
	createStringOption,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

const options = {
	type: createStringOption({
		description: "Type of data to clear",
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
	name: "clear",
	description: "Clear database data",
})
@Options(options)
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
export default class ClearDatabaseCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { client } = ctx;
		const type = ctx.options.type;
		// Clean up user ID from mention format if present
		const userId = ctx.options.user_id.replace(/[<@!>]/g, "");

		// Create buttons using Seyfert's Button builder
		const confirmButton = new Button()
			.setCustomId("confirm_clear")
			.setLabel("Confirm")
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new Button()
			.setCustomId("cancel_clear")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Secondary);

		// Create action row with buttons
		const row = new ActionRow<Button>().setComponents([
			confirmButton,
			cancelButton,
		]);

		// Send confirmation message with buttons
		const confirmation = await ctx.write(
			{
				embeds: [
					{
						description: `Are you sure you want to clear ${type} data for user <@${userId}>?`,
						color: client.config.color.primary,
					},
				],
				components: [row],
				flags: MessageFlags.Ephemeral,
			},
			true,
		); // Set fetchReply to true to get the message object

		try {
			// Create collector with filter and timeout
			const collector = confirmation.createComponentCollector({
				filter: (i: ComponentInteraction) => {
					if (!i.member?.user) return false;
					return (
						(i.member.user.id === ctx.author.id &&
							i.customId.startsWith("confirm_")) ||
						i.customId.startsWith("cancel_")
					);
				},
				idle: 15000, // 15 seconds timeout
			});

			// Handle button interactions
			collector.run(/./, async (interaction: ComponentInteraction) => {
				if (interaction.customId === "cancel_clear") {
					await interaction.update({
						embeds: [
							{
								description: "Operation cancelled",
								color: client.config.color.no,
							},
						],
						components: [],
					});
					collector.stop("cancelled");
					return;
				}

				if (interaction.customId === "confirm_clear") {
					const startTime = Date.now();
					let message = "";

					try {
						switch (type) {
							case "votes":
								await client.database.clearVoteData(userId);
								message = `✅ Cleared vote data for user <@${userId}>`;
								break;

							case "playlists":
								await client.database.clearPlaylistData(userId);
								message = `✅ Cleared playlist data for user <@${userId}>`;
								break;

							case "premium":
								await client.database.clearPremiumData(userId);
								message = `✅ Cleared premium data for user <@${userId}>`;
								break;

							case "stats":
								await client.database.clearStatsData();
								message = "✅ Cleared all stats data";
								break;

							case "all":
								await client.database.clearAllData(userId);
								message = `✅ Cleared all data for user <@${userId}>`;
								break;
						}

						const timeTaken = Date.now() - startTime;
						await interaction.update({
							embeds: [
								{
									description: `${message}\nOperation completed in ${timeTaken}ms`,
									color: client.config.color.primary,
								},
							],
							components: [],
						});
					} catch (error) {
						client.logger.error("Database clear error:", error);
						await interaction.update({
							embeds: [
								{
									description:
										"❌ An error occurred while clearing the database",
									color: client.config.color.no,
								},
							],
							components: [],
						});
					}
					collector.stop("completed");
				}
			});

			// Handle collector end using collector.stop event
			collector.stop = async (reason: string) => {
				if (reason === "time") {
					await confirmation.edit({
						embeds: [
							{
								description: "Confirmation timed out",
								color: client.config.color.no,
							},
						],
						components: [],
					});
				}
			};
		} catch (error) {
			client.logger.error("Database clear error:", error);
			await confirmation.edit({
				embeds: [
					{
						description: "❌ An error occurred while clearing the database",
						color: client.config.color.no,
					},
				],
				components: [],
			});
		}
	}
}
