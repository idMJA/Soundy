import { createEvent, Embed } from "seyfert";

export default createEvent({
	data: { name: "guildDelete" },
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
			.setColor(client.config.color.no)
			.setTitle("Server Left")
			.setDescription(
				"`👋` A guild removed me... I hope I was helpful during my stay!",
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
	},
});
