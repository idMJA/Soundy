import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	Options,
	SubCommand,
	createStringOption,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const option = {
	name: createStringOption({
		description: "The name of the playlist",
		required: true,
		locales: {
			name: "cmd.playlist.sub.delete.options.name.name",
			description: "cmd.playlist.sub.delete.options.name.description",
		},
	}),
};

@Declare({
	name: "delete",
	description: "Delete a playlist",
})
@LocalesT("cmd.playlist.sub.delete.name", "cmd.playlist.sub.delete.description")
@Options(option)
@Middlewares(["checkNodes"])
export default class DeletePlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const userId = ctx.author.id;

		const { cmd } = await ctx.getLocale();

		try {
			const playlist = await client.database.getPlaylist(userId, options.name);

			if (!playlist) {
				return ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.playlist.run.not_found}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			await client.database.deletePlaylist(userId, options.name);

			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${cmd.playlist.sub.delete.run.deleted({ playlist: `**${options.name}**` })}`,
					},
				],
			});
		} catch {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.delete.run.error}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
