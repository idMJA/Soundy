import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	Embed,
	LocalesT,
	type Message,
	Modal,
	type ModalSubmitInteraction,
	SubCommand,
	TextInput,
} from "seyfert";
import { Label } from "seyfert/lib/builders/Label";
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

		const reportButton = new Button()
			.setCustomId("open-bug-report")
			.setLabel("Report a Bug")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.pencil);

		const row = new ActionRow<Button>().addComponents(reportButton);

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

		const descriptionInput = new TextInput()
			.setCustomId("bug-description")
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.bug.run.description_placeholder);

		const stepsInput = new TextInput()
			.setCustomId("bug-steps")
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.bug.run.steps_placeholder);

		const modal = new Modal()
			.setCustomId("bug-report-modal")
			.setTitle(cmd.report.sub.bug.run.label)
			.setComponents([
				new Label()
					.setLabel(cmd.report.sub.bug.run.description)
					.setDescription(cmd.report.sub.bug.run.description_placeholder)
					.setComponent(descriptionInput),
				new Label()
					.setLabel(cmd.report.sub.bug.run.steps)
					.setDescription(cmd.report.sub.bug.run.steps_placeholder)
					.setComponent(stepsInput),
			])
			.run(async (modalCtx: ModalSubmitInteraction) => {
				const description =
					modalCtx.data.components?.[0]?.component?.value ?? "";
				const steps = modalCtx.data.components?.[1]?.component?.value ?? "";
				const reportId = Date.now().toString(36);

				try {
					let webhookSuccess = true;

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
						} catch {}
					}
				} catch (error) {
					client.logger.error("Modal submission error:", error);

					const errorEmbed = new Embed()
						.setColor(client.config.color.no)
						.setTitle("Error")
						.setDescription(cmd.report.sub.bug.run.error_description);

					try {
						await modalCtx.write({
							embeds: [errorEmbed],
							flags: MessageFlags.Ephemeral,
						});
					} catch {
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

		const collector = message.createComponentCollector({
			filter: (i) => i.customId === "open-bug-report",
			idle: 300000,
		});

		collector.run(
			"open-bug-report",
			async (interaction: ComponentInteraction) => {
				if (interaction.user.id !== ctx.author.id) {
					await interaction.write({
						embeds: [
							new Embed()
								.setColor(client.config.color.no)
								.setDescription(cmd.report.sub.bug.run.invalid_user),
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
