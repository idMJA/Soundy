import {
	ActionRow,
	Button,
	Command,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	Embed,
	LocalesT,
	type Message,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "about",
	description: "Show information about me",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.about.name", "cmd.about.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Informations })
export default class AboutCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;

		const { cmd, event } = await ctx.getLocale();

		// Get server and user counts
		const guildCount = client.cache.guilds?.count() ?? 0;
		const userCount = client.cache.users?.count() ?? 0;

		// Create the main about embed
		const aboutEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.title,
			})
			.setDescription(
				[
					`${client.config.emoji.info} **${cmd.about.run.about_me.title}**`,
					"",
					cmd.about.run.about_me[1],
					"",
					`${client.config.emoji.list} **${cmd.about.run.about_me[2]}**`,
					"",
					cmd.about.run.about_me[3],
					cmd.about.run.about_me[4],
					cmd.about.run.about_me[5],
					cmd.about.run.about_me[6],
					cmd.about.run.about_me[7],
					cmd.about.run.about_me[8],
					"",
					`${client.config.emoji.link} **${cmd.about.run.about_me[9]}**`,
					"",
					`- [${cmd.about.run.about_me[10]}](${client.config.info.inviteLink})`,
					`- [${cmd.about.run.about_me[11]}](${client.config.info.supportServer})`,
					`- [${cmd.about.run.about_me[12]}](${client.config.info.voteLink})`,
					"",
					`${client.config.emoji.info} **${cmd.about.run.about_me[13]}**`,
					"",
					cmd.about.run.about_me[14]({ author: "iaMJ" }),
					cmd.about.run.about_me[15]({ developer: "Tronix Development" }),
					cmd.about.run.about_me[16]({ country: "Indonesia" }),
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		// Create the contributors embed
		const contributorsEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.contributors.title,
			})
			.setDescription(
				[
					`${client.config.emoji.info} **${cmd.about.run.contributors[1]}**`,
					"",
					`- ${cmd.about.run.contributors[2]({ author: "iaMJ" })}`,
					`- ${cmd.about.run.contributors[3]({ user: "kydo" })}`,
					`- ${cmd.about.run.contributors[4]({ user: "JustEvil" })}`,
					"",
					`${client.config.emoji.link} **${cmd.about.run.contributors[5]}**`,
					"",
					`- ${cmd.about.run.contributors[6]}`,
					`- ${cmd.about.run.contributors[7]}`,
					"",
					`${client.config.emoji.info} **${cmd.about.run.contributors[8]}**`,
					"",
					cmd.about.run.contributors[9]({
						license: "GNU Affero General Public License v3.0",
					}),
					`**[${cmd.about.run.contributors[10]}](https://github.com/idMJA/Soundy/blob/master/LICENSE)**`,
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		// Create the packages embed
		const packagesEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.packages.title,
			})
			.setDescription(
				[
					`${client.config.emoji.list} **${cmd.about.run.packages[1]}**`,
					"",
					"- **[Seyfert](https://seyfert.dev)**",
					"- **[lavalink-client](https://github.com/Tomato6966/lavalink-client)**",
					"- **[Lavalink](https://lavalink.dev)**",
					"- **[Bun](https://bun.sh)**",
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		// Create button rows
		const row = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("about")
				.setLabel("About")
				.setStyle(ButtonStyle.Primary),
			new Button()
				.setCustomId("contributors")
				.setLabel("Contributors")
				.setStyle(ButtonStyle.Secondary),
			new Button()
				.setCustomId("packages")
				.setLabel("Packages")
				.setStyle(ButtonStyle.Secondary),
		);

		// Send the initial embed with buttons - Setting fetchReply to true to get the message object
		const message = (await ctx.write(
			{
				embeds: [aboutEmbed],
				components: [row],
			},
			true,
		)) as Message;

		// Function to create row with the correct button highlighted
		const getButtonRow = (activeButton: string) => {
			return new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("about")
					.setLabel(cmd.about.run.about_me.button)
					.setStyle(
						activeButton === "about"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "about"),
				new Button()
					.setCustomId("contributors")
					.setLabel(cmd.about.run.contributors.button)
					.setStyle(
						activeButton === "contributors"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "contributors"),
				new Button()
					.setCustomId("packages")
					.setLabel(cmd.about.run.packages.button)
					.setStyle(
						activeButton === "packages"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "packages"),
			);
		};

		// Create collector for the buttons
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				["about", "contributors", "packages"].includes(i.customId),
			idle: 60000, // 1 minute timeout
		});

		// Handle button interactions
		collector.run(/./, async (interaction: ComponentInteraction) => {
			// Verify interaction is from the command user
			if (interaction.user.id !== ctx.author.id) {
				await interaction.write({
					content: `${client.config.emoji.no} ${event.paginator.only_author}`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			// Handle button press
			if (interaction.customId === "about") {
				await interaction.update({
					embeds: [aboutEmbed],
					components: [getButtonRow("about")],
				});
			} else if (interaction.customId === "contributors") {
				await interaction.update({
					embeds: [contributorsEmbed],
					components: [getButtonRow("contributors")],
				});
			} else if (interaction.customId === "packages") {
				await interaction.update({
					embeds: [packagesEmbed],
					components: [getButtonRow("packages")],
				});
			}
		});

		// Handle collector end event
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				try {
					// Disable buttons when collector times out
					const disabledRow = new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("about")
							.setLabel(cmd.about.run.about_me.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
						new Button()
							.setCustomId("contributors")
							.setLabel(cmd.about.run.contributors.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
						new Button()
							.setCustomId("packages")
							.setLabel(cmd.about.run.packages.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					);

					// Update message with disabled buttons
					await message.edit({
						components: [disabledRow],
					});
				} catch (error) {
					client.logger.error("Failed to update buttons after timeout:", error);
				}
			}
		};
	}
}
