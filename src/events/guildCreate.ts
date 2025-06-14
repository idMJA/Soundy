import { ActionRow, Button, Embed, createEvent } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";

export default createEvent({
	data: { name: "guildCreate" },
	run: async (guild, client) => {
		if (guild.unavailable) return;

		// Ensure we have a valid guild object
		if (!("name" in guild)) return;

		// Try to get full guild data from cache first
		const cachedGuild = await client.cache.guilds?.get(guild.id);
		const guildData = cachedGuild || guild;

		const guildIcon = guildData.icon
			? `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.png`
			: "";

		// Get owner info from cache
		const ownerId = guildData.ownerId;
		const cachedOwner = await client.cache.users?.get(ownerId);

		const embed = new Embed()
			.setColor(client.config.color.yes)
			.setTitle("New Server")
			.setDescription(
				"`📦`  A new guild has added me! I hope I can be helpful in this journey.",
			)
			.setThumbnail(guildIcon)
			.addFields(
				{
					name: "`📜` Server Name",
					value: `\`${guildData.name}\``,
					inline: false,
				},
				{ name: "`🏮` Server ID", value: `\`${guildData.id}\``, inline: false },
				{
					name: "`👤` Owner",
					value: cachedOwner
						? `\`${cachedOwner.globalName ?? cachedOwner.username}\` (\`${ownerId}\`)`
						: `\`Unknown\` (\`${ownerId}\`)`,
					inline: false,
				},
				{
					name: "`👥` Members",
					value: `\`${guildData.memberCount ?? "Unknown"}\``,
					inline: false,
				},
				{
					name: "`📅` Created At",
					value: `<t:${Math.floor(guildData.createdTimestamp / 1000)}:R>`,
					inline: false,
				},
				{
					name: "`🤖` Server Count",
					value: `\`${await client.cache.guilds?.count?.()}\``,
					inline: false,
				},
			)
			.setTimestamp();

		await fetch(client.config.webhooks.guildLog, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: "Server Logs",
				embeds: [embed.toJSON()],
			}),
		}).catch((error) =>
			client.logger.error("Failed to send webhook message:", error),
		);

		// Try to send welcome message to the system channel
		try {
			const channels = await guildData.channels.list();
			const textChannels = channels.filter((c) => c.type === 0); // 0 is GuildText in Seyfert

			// Try to find system channel first, then fall back to first text channel
			const targetChannelId = guildData.systemChannelId
				? guildData.systemChannelId
				: textChannels[0]?.id;

			if (targetChannelId) {
				const welcomeEmbed = new Embed()
					.setColor(client.config.color.yes)
					.setTitle(
						`${client.config.emoji.party} Thanks for inviting ${client.me.username}!`,
					)
					.setDescription(
						[
							`Hi **${guildData.name}**! Thanks for adding me to your server!`,
							"",
							`${client.config.emoji.info} Here's what you need to know:`,
							`${client.config.emoji.slash} Use \`${client.config.defaultPrefix}help\` or \`/help\` to see all available commands`,
							`${client.config.emoji.music} Start playing music with \`${client.config.defaultPrefix}play\` or \`/play\``,
							"",
							`${client.config.emoji.question} Need help? Join our [Support Server](${client.config.info.supportServer})`,
							`${client.config.emoji.globe} Don't forget to vote for us if you enjoy using the bot!`,
						].join("\n"),
					)
					.setThumbnail(guildIcon)
					.setFooter({
						text: `© Tronix Development ${new Date().getFullYear()}`,
					})
					.setTimestamp();

				const row = new ActionRow().addComponents(
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
				);

				await client.messages.write(targetChannelId, {
					embeds: [welcomeEmbed],
					components: [row],
				});
			}
		} catch (error) {
			client.logger.error("Failed to send welcome message:", error);
		}
	},
});
