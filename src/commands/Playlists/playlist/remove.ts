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
		autocomplete: async (interaction) => {
			const { client, guildId, member } = interaction;
			if (!guildId || !member) return;
			const playlists = await client.database.getPlaylists(member.id);
			if (!playlists.length) {
				return interaction.respond([
					{ name: "No playlists found", value: "noPlaylists" },
				]);
			}
			return interaction.respond(
				playlists.slice(0, 25).map((playlist) => ({
					name: playlist.name,
					value: playlist.id,
				})),
			);
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
			let playlist = await client.database.getPlaylistById(options.name);

			if (!playlist) {
				const userPlaylists = await client.database.getPlaylists(userId);
				playlist =
					userPlaylists.find(
						(p) => p.name.toLowerCase() === options.name.toLowerCase(),
					) || null;
			}

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

			if (playlist.userId !== userId) {
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

			const tracks = playlist.tracks;
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
			if (!trackToRemove || !trackToRemove.id) {
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

			await client.database.removeSong(playlist.id, trackToRemove.id);

			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${cmd.playlist.sub.remove.run.removed({ name: `**${playlist.name}**` })}`,
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
