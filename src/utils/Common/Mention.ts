import type { UsingClient } from "seyfert";
import { ActionRow, Button, Embed, type Message } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types";

/**
 * Check if a message is a bot mention
 * @param message The message to check
 * @param clientId The bot's client ID
 * @returns Whether the message is a bot mention
 */
export function isBotMention(message: Message, clientId: string): boolean {
	const mentionRegex = new RegExp(`^<@!?${clientId}>( |)$`);
	return mentionRegex.test(message.content);
}

/**
 * Handle a mention of the bot and generate the response
 * @param client The client instance
 * @param message The message that mentioned the bot
 * @param prefixes The available prefixes
 * @returns The prefixes array
 */
export async function handleMention(
	client: UsingClient,
	message: Message,
	prefixes: string[],
): Promise<string[]> {
	try {
		const command = client.commands?.values.find((cmd) => cmd.name === "help");

		if (!command) {
			await message.react("❌").catch(() => {});
			await message
				.reply({
					allowed_mentions: { replied_user: true },
					embeds: [getErrorResponse("Command not found")],
				})
				.catch(client.logger.error);
			return prefixes;
		}

		const response = {
			embed: new Embed()
				.setColor(0x2ecc71) // success color
				.setTitle(`${client.config.emoji.music} Welcome to Soundy!`)
				.setDescription(
					[
						`${client.config.emoji.slash} Use \`${prefixes[0]}help\` or \`/help\` to discover all my amazing commands`,
						`${client.config.emoji.home} Need help? Join our [Support Server](${client.config.info.supportServer}) for assistance`,
						`${client.config.emoji.info} Want to get started? Just type \`${prefixes[0]}play\` or \`/play\` to begin your musical journey!`,
						"",
						`${client.config.emoji.party} **Features:**`,
						`${client.config.emoji.music} High quality music streaming`,
						`${client.config.emoji.list} Rich playlist management`,
						`${client.config.emoji.globe} Support for multiple platforms`,
					].join("\n"),
				)
				.setThumbnail(client.me.avatarURL())
				.setFooter({
					text: "Play a high quality music in your Discord server for free.",
				}),
			components: [
				new ActionRow().addComponents(
					new Button()
						.setStyle(ButtonStyle.Link)
						.setLabel("Add to Server")
						.setEmoji(client.config.emoji.link)
						.setURL(client.config.info.inviteLink),
					new Button()
						.setStyle(ButtonStyle.Link)
						.setLabel("Support Server")
						.setEmoji(client.config.emoji.home)
						.setURL(client.config.info.supportServer),
					new Button()
						.setStyle(ButtonStyle.Link)
						.setLabel("Vote")
						.setEmoji(client.config.emoji.globe)
						.setURL(client.config.info.voteLink),
				),
			],
		};

		await message
			.reply({
				allowed_mentions: { replied_user: true },
				embeds: [response.embed],
				components: response.components,
			})
			.catch(client.logger.error);
		return prefixes;
	} catch (error) {
		client.logger.error("Error handling mention:", error);
		await message.react("❌").catch(() => {});
		return prefixes;
	}
}

/**
 * Get the error response embed for when help command is not found
 * @param errorMessage The error message to display
 * @returns The error embed
 */
export function getErrorResponse(errorMessage: string) {
	return {
		color: 0xff0000, // red color
		description: errorMessage,
	};
}
