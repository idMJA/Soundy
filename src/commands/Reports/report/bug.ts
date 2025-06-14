import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	LocalesT,
	type Message,
	Modal,
	type ModalSubmitInteraction,
	SubCommand,
	TextInput,
} from "seyfert";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types";

@Declare({
	name: "bug",
	description: "Report a bug you found in the bot",
})
@LocalesT("cmd.report.sub.bug.name", "cmd.report.sub.bug.description")
export default class BugReportCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client } = ctx;
		const userId = ctx.author.id;
		const guildId = await ctx.guild();

		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		// Create report button
		const reportButton = new Button()
			.setCustomId("open-bug-report")
			.setLabel("Report a Bug")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.pencil);

		const row = new ActionRow<Button>().addComponents(reportButton);

		// Send initial message with button and fetch the reply
		const message = (await ctx.write(
			{
				embeds: [
					{
						color: client.config.color.primary,
						title: cmd.report.sub.bug.run.init_title,
						description: cmd.report.sub.bug.run.init_description,
					},
				],
				components: [row],
			},
			true,
		)) as Message;

		// Create the text inputs for modal
		const descriptionInput = new TextInput()
			.setCustomId("bug-description")
			.setLabel(cmd.report.sub.bug.run.description)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.bug.run.description_placeholder);

		const stepsInput = new TextInput()
			.setCustomId("bug-steps")
			.setLabel(cmd.report.sub.bug.run.steps)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.bug.run.steps_placeholder);

		// Create the modal with its handler
		const modal = new Modal()
			.setCustomId("bug-report-modal")
			.setTitle(cmd.report.sub.bug.run.label)
			.addComponents(
				new ActionRow<TextInput>().addComponents(descriptionInput),
				new ActionRow<TextInput>().addComponents(stepsInput),
			)
			.run(async (modalCtx: ModalSubmitInteraction) => {
				const description =
					modalCtx.data.components?.[0]?.components?.[0]?.value ?? "";
				const steps =
					modalCtx.data.components?.[1]?.components?.[0]?.value ?? "";
				const reportId = Date.now().toString(36);

				try {
					let webhookSuccess = true;

					// Try to send report to webhook if configured
					if (client.config.webhooks?.report) {
						try {
							const webhookBody = {
								username: client.me.name,
								avatar_url: client.me.avatarURL(),
								embeds: [
									{
										color: client.config.color.primary,
										title: "New Bug Report",
										description: `**Report ID:** \`${reportId}\`\n**From:** <@${userId}> (\`${userId}\`)\n**Guild:** \`${guildId}\``,
										fields: [
											{
												name: "Description",
												value: description,
											},
											{
												name: "Steps to Reproduce",
												value: steps,
											},
										],
										timestamp: new Date().toISOString(),
									},
								],
							};

							const response = await fetch(
								`${client.config.webhooks.report}?wait=true`,
								{
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify(webhookBody),
								},
							);

							if (!response.ok) {
								throw new Error(
									`Webhook error: ${response.status} ${response.statusText}`,
								);
							}
						} catch (error) {
							client.logger.error("Webhook error:", error);
							webhookSuccess = false;
						}
					}

					// Send response to user
					await modalCtx.write({
						content: "",
						embeds: [
							{
								color: webhookSuccess
									? client.config.color.primary
									: client.config.color.no,
								title: webhookSuccess
									? cmd.report.sub.bug.run.success
									: cmd.report.sub.bug.run.error,
								description: webhookSuccess
									? cmd.report.sub.bug.run.success_description({
											reportId: `\`${reportId}\``,
										})
									: cmd.report.sub.bug.run.error_description,
							},
						],
						flags: MessageFlags.Ephemeral,
					});

					// Only try to update the original message if everything was successful
					if (webhookSuccess) {
						try {
							await message.edit({
								embeds: [
									{
										color: client.config.color.primary,
										title: cmd.report.sub.bug.run.init_title,
										description: cmd.report.sub.bug.run.init_description,
									},
								],
								components: [row],
							});
						} catch {
							// Don't throw here as the report was still submitted successfully
						}
					}
				} catch (error) {
					client.logger.error("Modal submission error:", error);

					const errorEmbed = {
						color: client.config.color.no,
						title: "Error",
						description: cmd.report.sub.bug.run.error_description,
					};

					try {
						await modalCtx.write({
							embeds: [errorEmbed],
							flags: MessageFlags.Ephemeral,
						});
					} catch {
						// If reply fails, try followup as fallback
						try {
							await modalCtx.followup({
								embeds: [errorEmbed],
								flags: MessageFlags.Ephemeral,
							});
						} catch (followUpError) {
							client.logger.error(
								"Failed to send error message:",
								followUpError,
							);
						}
					}
				}
			});

		// Create collector for the button
		const collector = message.createComponentCollector({
			filter: (i) => i.customId === "open-bug-report",
			idle: 300000, // 5 minutes
		});

		// Handle button click
		collector.run(
			"open-bug-report",
			async (interaction: ComponentInteraction) => {
				// Check if the user is authorized
				if (interaction.user.id !== ctx.author.id) {
					await interaction.write({
						embeds: [
							{
								color: client.config.color.no,
								description: cmd.report.sub.bug.run.invalid_user,
							},
						],
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				await interaction.modal(modal);
			},
		);
	}
}
