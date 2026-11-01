import ky from "ky";
import { Embed, type UsingClient } from "seyfert";

export interface VoteUser {
	id: string;
	username: string;
	name?: string;
	avatar?: string | null;
	discriminator?: string | null;
}

/**
 * Sends a vote notification through Discord webhook
 * @param client - The Soundy client instance
 * @param voter - The user who voted (or tested)
 * @param isTest - Whether this is a Top.gg dashboard test webhook
 * @returns Promise<boolean> - Whether the webhook was sent successfully
 */
export async function sendVoteWebhook(
	client: UsingClient,
	voter: VoteUser,
	isTest = false,
): Promise<boolean> {
	try {
		if (!isTest) {
			// Add premium access for 12 hours
			await client.database.addUserVote(voter.id);
			client.logger.info(
				`[Vote] Processed vote from ${voter.username} (${voter.id})`,
			);
		} else {
			client.logger.info(
				`[Vote] Processed test vote from ${voter.username} (${voter.id})`,
			);
		}

		const avatarUrl = voter.avatar
			? `https://cdn.discordapp.com/avatars/${voter.id}/${voter.avatar}.webp`
			: `https://cdn.discordapp.com/embed/avatars/${Number(voter.discriminator || "0") % 5}.png`;

		const voteEmbed = new Embed()
			.setColor(isTest ? 0x22c55e : client.config.color.primary)
			.setAuthor({
				name: isTest
					? `[TEST] ${voter.name || voter.username}`
					: `${voter.name || voter.username}`,
				iconUrl: avatarUrl,
			})
			.setThumbnail(avatarUrl)
			.setDescription(
				isTest
					? [
							"🧪 **Top.gg Webhook Test Verification**",
							`Tester: <@${voter.id}> (\`${voter.id}\`)`,
							"",
							"Top.gg webhook endpoint connected and verified successfully!",
						].join("\n")
					: [
							`${client.config.emoji.user} **${voter.username}** \`(${voter.id})\` just rocked the vote for Soundy on [Top.gg](${client.config.info.voteLink})!\n`,
							"You're awesome for choosing us! May your day be filled with fantastic tunes and good vibes. Let's keep the music playing!",
						].join("\n"),
			)
			.setFooter({
				text: isTest
					? "Top.gg Webhook Test Verification"
					: "Thanks for choosing Soundy!",
			})
			.setTimestamp();

		if (client.config.webhooks?.voteLog) {
			await ky.post(client.config.webhooks.voteLog, {
				json: {
					username: client.me.name,
					avatar_url: client.me.avatarURL(),
					content: `<@${voter.id}>`,
					embeds: [voteEmbed.toJSON()],
				},
			});
		}

		client.logger.info(
			`[Vote] Discord webhook notification sent for ${voter.username} (${voter.id})`,
		);

		return true;
	} catch (error) {
		client.logger.error(
			`[Vote] Error processing vote for ${voter.username} (${voter.id}):`,
			error,
		);
		throw error;
	}
}
