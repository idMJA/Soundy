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
	Embed,
} from "seyfert";
import { Label } from "seyfert/lib/builders/Label";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types";

@Declare({
	name: "suggestions",
	description: "Give a suggestion you want to see in the bots",
})
@LocalesT(
	"cmd.report.sub.suggestion.name",
	"cmd.report.sub.suggestion.description",
)
export default class SuggestionsCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client } = ctx;
		const userId = ctx.author.id;
		const guildId = await ctx.guild();

		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const reportButton = new Button()
			.setCustomId("open-suggestions-report")
			.setLabel(cmd.report.sub.suggestion.run.label)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.pencil);

		const row = new ActionRow<Button>().addComponents(reportButton);

		const message = (await ctx.write(
			{
				embeds: [
					{
						color: client.config.color.primary,
						title: cmd.report.sub.suggestion.run.init_title,
						description: cmd.report.sub.suggestion.run.init_description,
					},
				],
				components: [row],
			},
			true,
		)) as Message;

		const descriptionInput = new TextInput()
			.setCustomId("suggestions-description")
			.setLabel(cmd.report.sub.suggestion.run.description)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.suggestion.run.description_placeholder);

		const stepsInput = new TextInput()
			.setCustomId("suggestions-steps")
			.setLabel(cmd.report.sub.suggestion.run.steps)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setLength({ min: 20, max: 1000 })
			.setPlaceholder(cmd.report.sub.suggestion.run.steps_placeholder);

		const modal = new Modal()
			.setCustomId("suggestions-report-modal")
			.setTitle(cmd.report.sub.suggestion.run.label)
			.setComponents([
				new Label()
					.setLabel(cmd.report.sub.suggestion.run.description)
					.setDescription(cmd.report.sub.suggestion.run.description_placeholder)
					.setComponent(descriptionInput),
				new Label()
					.setLabel(cmd.report.sub.suggestion.run.steps)
					.setDescription(cmd.report.sub.suggestion.run.steps_placeholder)
					.setComponent(stepsInput),
			])
			.run(async (modalCtx: ModalSubmitInteraction) => {
				const description =
					modalCtx.data.components?.[0]?.components?.[0]?.value ?? "";
				const steps =
					modalCtx.data.components?.[1]?.components?.[0]?.value ?? "";
				const reportId = Date.now().toString(36);

				let webhookSuccess = true;
				try {
					if (client.config.webhooks?.report) {
						try {
							const webhookBody = {
								username: client.me.name,
								avatar_url: client.me.avatarURL(),
								embeds: [
									{
										color: client.config.color.primary,
										title: "New Suggestion",
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
									? cmd.report.sub.suggestion.run.success
									: cmd.report.sub.suggestion.run.error,
								description: webhookSuccess
									? cmd.report.sub.suggestion.run.success_description({
											reportId: `\`${reportId}\``,
										})
									: cmd.report.sub.suggestion.run.error_description,
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
										title: cmd.report.sub.suggestion.run.init_title,
										description: cmd.report.sub.suggestion.run.init_description,
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
						.setTitle(cmd.report.sub.suggestion.run.error)
						.setDescription(cmd.report.sub.suggestion.run.error_description);

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
			filter: (i) => i.customId === "open-suggestions-report",
			idle: 300000,
		});

		collector.run(
			"open-suggestions-report",
			async (interaction: ComponentInteraction) => {
				if (interaction.user.id !== ctx.author.id) {
					await interaction.write({
						embeds: [
							new Embed()
								.setColor(client.config.color.no)
								.setDescription(cmd.report.sub.suggestion.run.invalid_user),
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
