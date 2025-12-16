import {
	type CommandContext,
	createStringOption,
	Declare,
	LocalesT,
	Middlewares,
	Options,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const option = {
	name: createStringOption({
		description: "The name of the playlist",
		required: true,
		locales: {
			name: "cmd.playlist.sub.create.options.name.name",
			description: "cmd.playlist.sub.create.options.name.description",
		},
	}),
};

@Declare({
	name: "create",
	description: "Create a new playlist",
})
@LocalesT("cmd.playlist.sub.create.name", "cmd.playlist.sub.create.description")
@Options(option)
@Middlewares(["checkNodes"])
export default class CreatePlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const userId = ctx.author.id;

		const { cmd } = await ctx.getLocale();

		try {
			// Check if playlist already exists
			const existingPlaylist = await client.database.getPlaylist(
				userId,
				options.name,
			);

			if (existingPlaylist) {
				return ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.playlist.sub.create.run.already_exists}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			// Create new playlist
			const createdPlaylist = await client.database.createPlaylist(
				userId,
				options.name,
			);

			if (!createdPlaylist) {
				throw new Error("Failed to create playlist");
			}

			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${cmd.playlist.sub.create.run.success({ playlist: options.name })}`,
					},
				],
			});
		} catch (error) {
			console.error("Error creating playlist:", error);
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.create.run.error}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
