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
import {
	TimeFormat,
	getAllTopTracks,
	type RecommendationTrack,
} from "#soundy/utils";

const option = {
	playlist: createStringOption({
		description: "The name of the playlist",
		required: true,
		locales: {
			name: "cmd.playlist.sub.add.options.playlist.name",
			description: "cmd.playlist.sub.add.options.playlist.description",
		},
	}),
	query: createStringOption({
		description: "Track URL, playlist URL, or search query",
		required: true,
		locales: {
			name: "cmd.playlist.sub.add.options.query.name",
			description: "cmd.playlist.sub.add.options.query.description",
		},
		autocomplete: async (interaction) => {
			const { client, member, guildId } = interaction;
			if (!guildId) return;

			const { autocomplete } = client.t(
				await client.database.getLocale(guildId),
			);

			if (!client.manager.useable)
				return interaction.respond([
					{ name: autocomplete.music.no_nodes.toString(), value: "noNodes" },
				]);

			if (!member)
				return interaction.respond([
					{ name: autocomplete.music.no_voice.toString(), value: "noVoice" },
				]);
			const voice = client.cache.voiceStates?.get(member.id, guildId);
			if (!voice)
				return interaction.respond([
					{ name: autocomplete.music.no_voice.toString(), value: "noVoice" },
				]);

			const query = interaction.getInput();
			if (!query) {
				const allTopTracks = await getAllTopTracks();
				const recommendedTracks: string[] = allTopTracks.flatMap(
					({ tracks }: { tracks: RecommendationTrack[] }) =>
						tracks.map(
							(track: RecommendationTrack) => `${track.name} ${track.artist}`,
						),
				);
				const allTracks = await Promise.all(
					recommendedTracks.slice(0, 10).map(async (trackQuery: string) => {
						const { tracks } = await client.manager.search(
							trackQuery,
							client.config.defaultSearchPlatform,
						);
						return tracks.slice(0, 2);
					}),
				);
				const flatTracks = allTracks.flat();
				const filteredTracks = flatTracks.filter(
					(t): t is Exclude<(typeof flatTracks)[number], undefined> =>
						t !== undefined,
				);
				for (let i = filteredTracks.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					const temp = filteredTracks[i];
					filteredTracks[i] = filteredTracks[j] as Exclude<
						(typeof flatTracks)[number],
						undefined
					>;
					filteredTracks[j] = temp as Exclude<
						(typeof flatTracks)[number],
						undefined
					>;
				}
				return interaction.respond(
					filteredTracks.slice(0, 10).map((track) => {
						const duration = track.info.isStream
							? "LIVE"
							: (TimeFormat.toDotted(track.info.duration) ?? "Unknown");
						return {
							name: `${track.info.title.slice(0, 20)} (${duration}) - ${track.info.author.slice(0, 30)}`,
							value: track.info.uri ?? "",
						};
					}),
				);
			}
			const { tracks } = await client.manager.search(
				query,
				client.config.defaultSearchPlatform,
			);
			if (!tracks.length)
				return interaction.respond([
					{ name: "No tracks found", value: "noTracks" },
				]);
			await interaction.respond(
				tracks.slice(0, 25).map((track) => {
					const duration = track.info.isStream
						? "LIVE"
						: (TimeFormat.toDotted(track.info.duration) ?? "Unknown");
					return {
						name: `${track.info.title.slice(0, 20)} (${duration}) - ${track.info.author.slice(0, 30)}`,
						value: track.info.uri ?? "",
					};
				}),
			);
		},
	}),
};

@Declare({
	name: "add",
	description: "Add a track to a playlist",
})
@LocalesT("cmd.playlist.sub.add.name", "cmd.playlist.sub.add.description")
@Options(option)
@Middlewares(["checkNodes"])
export default class AddPlaylistCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const userId = ctx.author.id;

		const { cmd } = await ctx.getLocale();

		try {
			const playlist = await client.database.getPlaylist(
				userId,
				options.playlist,
			);

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

			const result = await client.manager.search(options.query);

			if (!result.tracks.length) {
				return ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.playlist.run.no_tracks}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			const tracksToAdd = result.tracks.map((track) => ({
				url: track.info.uri,
				info: {
					identifier: track.info.identifier,
					author: track.info.author,
					length: track.info.duration,
					isStream: track.info.isStream,
					title: track.info.title,
					uri: track.info.uri,
					artworkUrl: track.info.artworkUrl,
					isrc: track.info.isrc,
				},
			}));

			await client.database.addTracksToPlaylist(
				userId,
				options.playlist,
				tracksToAdd,
			);

			const responseMessage =
				result.tracks.length > 1
					? cmd.playlist.sub.add.run.added({
							track: result.tracks.length.toString(),
							playlist: `**${options.playlist}**`,
						})
					: cmd.playlist.sub.add.run.added({
							track: result.tracks[0]?.info.title ?? "",
							playlist: `**${options.playlist}**`,
						});

			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.primary,
						description: `${client.config.emoji.yes} ${responseMessage}`,
					},
				],
			});
		} catch {
			return ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.playlist.sub.add.run.error}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
