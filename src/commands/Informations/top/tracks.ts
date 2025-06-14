import {
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	SubCommand,
} from "seyfert";

@Declare({
	name: "tracks",
	description: "Shows the most played tracks in the last 2 weeks",
})
@LocalesT("cmd.top.sub.tracks.name", "cmd.top.sub.tracks.description")
export default class TopTracksCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const tracks = await client.database.getTopTracks("", 10); // Using empty string for global stats

		if (!tracks.length) {
			return ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.primary)
						.setTitle(
							`${client.config.emoji.music} ${cmd.top.sub.tracks.run.title}`,
						)
						.setDescription(cmd.top.sub.tracks.run.no_data),
				],
			});
		}

		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.music} ${cmd.top.sub.tracks.run.title}`)
			.setDescription(cmd.top.sub.tracks.run.description)
			.addFields(
				tracks.map((track, index) => ({
					name: `${index + 1}. ${track.title}`,
					value: cmd.top.sub.tracks.run.fields({
						author: track.author,
						playCount: track.playCount,
						trackId: track.trackId,
					}),
				})),
			)
			.setFooter({
				text: cmd.top.sub.tracks.run.footer({ length: tracks.length }),
			})
			.setTimestamp();

		return ctx.editOrReply({ embeds: [embed] });
	}
}
