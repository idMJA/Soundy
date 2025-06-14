import {
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	SubCommand,
} from "seyfert";

interface GuildStats {
	guildId: string;
	totalPlays: number;
	uniqueTracks: number;
}

@Declare({
	name: "guilds",
	description: "Shows the most active music servers in the last 2 weeks",
})
@LocalesT("cmd.top.sub.guilds.name", "cmd.top.sub.guilds.description")
export default class TopGuildsCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client } = ctx;

		const { cmd } = await ctx.getLocale();
		const guilds = await client.database.getTopGuilds(10);

		if (!guilds.length) {
			return ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setTitle(
							`${client.config.emoji.list} ${cmd.top.sub.guilds.run.title}`,
						)
						.setDescription(cmd.top.sub.guilds.run.no_data),
				],
			});
		}

		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.list} ${cmd.top.sub.guilds.run.title}`)
			.setDescription(cmd.top.sub.guilds.run.description)
			.addFields(
				await Promise.all(
					guilds.map(async (guild: GuildStats, index: number) => {
						const guildData = await client.guilds
							.fetch(guild.guildId)
							.catch(() => null);
						return {
							name: `${index + 1}. ${guildData?.name ?? cmd.top.sub.guilds.run.unknown}`,
							value: cmd.top.sub.guilds.run.fields({
								totalPlays: guild.totalPlays,
								uniqueTracks: guild.uniqueTracks,
							}),
						};
					}),
				),
			)
			.setFooter({
				text: cmd.top.sub.guilds.run.footer({ length: guilds.length }),
			})
			.setTimestamp();

		return ctx.editOrReply({ embeds: [embed] });
	}
}
