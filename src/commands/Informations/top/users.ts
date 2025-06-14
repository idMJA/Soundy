import {
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	SubCommand,
} from "seyfert";

@Declare({
	name: "users",
	description: "Shows the most active users in the last 2 weeks",
})
@LocalesT("cmd.top.sub.users.name", "cmd.top.sub.users.description")
export default class TopUsersCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const users = await client.database.getTopUsers("", 10);

		if (!users.length) {
			return ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.primary)
						.setTitle(
							`${client.config.emoji.user} ${cmd.top.sub.users.run.title}`,
						)
						.setDescription(cmd.top.sub.users.run.no_data),
				],
			});
		}

		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.user} ${cmd.top.sub.users.run.title}`)
			.setDescription(cmd.top.sub.users.run.description)
			.addFields(
				await Promise.all(
					users.map(async (user, index) => {
						const member = await client.users
							.fetch(user.userId)
							.catch(() => null);
						return {
							name: `${index + 1}. ${member?.globalName ?? cmd.top.sub.users.run.unknown}`,
							value: cmd.top.sub.users.run.fields({
								playCount: user.playCount,
							}),
						};
					}),
				),
			)
			.setFooter({
				text: cmd.top.sub.users.run.footer({ length: users.length }),
			})
			.setTimestamp();

		return ctx.editOrReply({ embeds: [embed] });
	}
}
