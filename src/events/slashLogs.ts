import { type ChatInputCommandInteraction, createEvent } from "seyfert";
import { sendCommandLog } from "#soundy/utils";

export default createEvent({
	data: {
		name: "interactionCreate",
	},
	async run(interaction, client) {
		const commandInteraction = interaction as ChatInputCommandInteraction;
		const { guildId } = commandInteraction;

		try {
			const guild = guildId ? await client.guilds.fetch(guildId) : null;
			const member = await commandInteraction.member;

			await sendCommandLog(client, {
				guildName: guild?.name,
				guildId: guildId ?? "DM",
				channelName: commandInteraction.channel?.toString() ?? "Unknown",
				channelId: commandInteraction.channel.id,
				commandName: `/${commandInteraction.data.name}`,
				commandType: "Slash",
				userId: commandInteraction.user.id,
				username: commandInteraction.user.username,
				displayName: member?.displayName,
			});
		} catch (error) {
			console.error("Error sending command log:", error);
		}
	},
});
