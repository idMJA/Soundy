import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	Options,
	SubCommand,
	createIntegerOption,
	createStringOption,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const option = {
	name: createStringOption({
		description: "The name of the playlist",
		required: true,
		locales: {
			name: "cmd.playlist.sub.remove.options.name.name",
			description: "cmd.playlist.sub.remove.options.name.description",
		},
	}),
	track: createIntegerOption({
		description: "The track number to remove",
		required: true,
		min_value: 1,
		locales: {
			name: "cmd.playlist.sub.remove.options.track.name",
			description: "cmd.playlist.sub.remove.options.track.description",
		},
	}),
};

@Declare({
	name: "remove",
	description: "Remove a track from a playlist",
})
@LocalesT("cmd.playlist.sub.remove.name", "cmd.playlist.sub.remove.description")
@Options(option)
@Middlewares(["checkVoiceChannel"])
export default class RemovePlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const userId = ctx.author.id;

		const { cmd } = await ctx.getLocale();

		try {
			const tracks = await client.database.getTracksFromPlaylist(
				userId,
				options.name,
			);

			if (!tracks) {
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

			const trackIndex = options.track - 1;
			if (trackIndex < 0 || trackIndex >= tracks.length) {
				return ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.playlist.sub.remove.run.invalid}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			const trackToRemove = tracks[trackIndex];
			// When calling the remove function, filter out undefined values
			const tracksToRemove = [trackToRemove].filter(
				(uri): uri is string => typeof uri === "string",
			);
			for (const uri of tracksToRemove) {
				await client.database.removeSong(userId, options.name, uri);
			}

			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${cmd.playlist.sub.remove.run.removed({ name: `**${options.name}**` })}`,
					},
				],
			});
		} catch {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.remove.run.error}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
