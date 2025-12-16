import { Client as Genius } from "genius-lyrics";
import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	Embed,
	LocalesT,
	Middlewares,
	Options,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import {
	getAllTopTracks,
	type RecommendationTrack,
	SoundyOptions,
	TimeFormat,
} from "#soundy/utils";

// Initialize Genius client
const geniusClient = new Genius();

const options = {
	query: createStringOption({
		description: "Song to search for or music URL.",
		required: false,
		locales: {
			name: "cmd.lyrics.options.query.name",
			description: "cmd.lyrics.options.query.description",
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

			const voice = client.cache.voiceStates?.get(member?.id ?? "", guildId);
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
	name: "lyrics",
	description: "Search for lyrics of a song",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.lyrics.name", "cmd.lyrics.description")
@SoundyOptions({ category: SoundyCategory.Music })
@Options(options)
@Middlewares(["checkNodes"])
export default class LyricsCommand extends Command {
	async run(ctx: CommandContext<typeof options>): Promise<void> {
		const { guildId, client } = ctx;
		if (!guildId) return;

		const { cmd, component } = await ctx.getLocale();

		let searchQuery: string;
		const player = client.manager.players.get(guildId);
		const track = player?.queue.current;
		const query = ctx.options.query;

		// Handle different input scenarios
		if (query) {
			if (this.isValidUrl(query)) {
				try {
					const result = await player?.search(
						{ query, source: client.config.defaultSearchPlatform },
						{ ...ctx.author, tag: ctx.author.tag },
					);

					if (!result?.tracks?.length || !result.tracks[0]) {
						throw new Error(cmd.lyrics.run.no_tracks);
					}

					searchQuery = `${result.tracks[0].info.title} ${result.tracks[0].info.author}`;
				} catch {
					await ctx.editOrReply({
						embeds: [
							new Embed()
								.setColor(client.config.color.no)
								.setDescription(
									`${client.config.emoji.no} ${cmd.lyrics.run.invalid_url}`,
								),
						],
					});
					return;
				}
			} else {
				searchQuery = query;
			}
		} else if (track) {
			searchQuery = `${track.info.title} ${track.info.author}`;
		} else {
			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setDescription(
							`${client.config.emoji.no} ${cmd.lyrics.run.provide_song}`,
						),
				],
			});
			return;
		}

		// Search for the song on Genius
		const searches = await geniusClient.songs.search(searchQuery);

		if (!searches.length || !searches[0]) {
			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setDescription(
							`${client.config.emoji.no} ${component.lyrics.no_lyrics}`,
						),
				],
			});
			return;
		}

		// Get the first result and lyrics
		const song = searches[0];
		const lyrics = await song.lyrics();

		// Split lyrics into chunks if too long
		const lyricsChunks = this.splitLyrics(lyrics);

		// Send first chunk
		const firstEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(
				`${client.config.emoji.list} ${component.lyrics.title({ song: song.title })}`,
			)
			.setURL(song.url)
			.setThumbnail(song.thumbnail)
			.setDescription(lyricsChunks[0])
			.setFooter({
				text: `${cmd.requested_by({ user: ctx.author.username })} • ${cmd.powered_by({ provider: "Genius" })}`,
				iconUrl: ctx.author.avatarURL(),
			});

		await ctx.editOrReply({ embeds: [firstEmbed] });

		// Send additional chunks if any
		for (let i = 1; i < lyricsChunks.length; i++) {
			const embed = new Embed()
				.setColor(client.config.color.primary)
				.setDescription(lyricsChunks[i]);
			await ctx.editOrReply({ embeds: [embed] });
		}
	}

	private splitLyrics(lyrics: string): string[] {
		const chunks: string[] = [];
		let currentChunk = "";

		const lines = lyrics.split("\n");
		for (const line of lines) {
			if (currentChunk.length + line.length + 1 > 4000) {
				chunks.push(currentChunk);
				currentChunk = line;
			} else {
				currentChunk += (currentChunk ? "\n" : "") + line;
			}
		}
		if (currentChunk) {
			chunks.push(currentChunk);
		}
		return chunks;
	}

	private isValidUrl(string: string): boolean {
		try {
			new URL(string);
			return true;
		} catch (_) {
			return false;
		}
	}
}
