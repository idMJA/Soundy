import { Client as Genius } from "genius-lyrics";
import type { Track, UnresolvedTrack } from "lavalink-client";
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
	fetchMusixmatchFallback,
	getAllTopTracks,
	type RecommendationTrack,
	SoundyOptions,
	TimeFormat,
} from "#soundy/utils";

interface LavalinkLyricsLine {
	timestamp: number;
	text: string;
}

interface LavalinkLyricsResponse {
	text?: string;
	lines?: LavalinkLyricsLine[];
	providerName?: string;
}

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

		const player = client.manager.players.get(guildId);
		const track = player?.queue.current;
		const query = ctx.options.query;

		let resolvedTrack: Track | UnresolvedTrack | null = null;
		let searchQuery = "";

		if (query) {
			if (this.isValidUrl(query)) {
				try {
					const result = await player?.search(
						{ query, source: client.config.defaultSearchPlatform },
						{ ...ctx.author, tag: ctx.author.tag },
					);

					const firstTrack = result?.tracks?.[0];
					if (firstTrack) {
						resolvedTrack = firstTrack;
						searchQuery = `${firstTrack.info.title} ${firstTrack.info.author}`;
					} else {
						throw new Error(cmd.lyrics.run.no_tracks);
					}
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

		let lyricsText: string | null = null;
		let lyricsProvider = "Unknown";
		let isSynced = false;
		let songTitle = track
			? track.info.title
			: resolvedTrack
				? resolvedTrack.info.title
				: searchQuery;
		let songThumbnail =
			track?.info.artworkUrl ?? resolvedTrack?.info.artworkUrl ?? undefined;
		let songUrl = track?.info.uri ?? resolvedTrack?.info.uri ?? undefined;

		const targetTrack = track || resolvedTrack;
		let lavalinkSuccess = false;

		if (player && targetTrack) {
			try {
				client.logger.info(
					`[Lyrics] Requesting lyrics from Lavalink node for: ${targetTrack.info.title}`,
				);
				const response = (await player.node.request(
					`/v4/lyrics?track=${encodeURIComponent(targetTrack.encoded ?? "")}&skipTrackSource=true`,
				)) as LavalinkLyricsResponse | null;

				if (response) {
					if (response.lines && response.lines.length > 0) {
						lyricsText = response.lines
							.map((line) => {
								const totalMs = line.timestamp || 0;
								const minutes = Math.floor(totalMs / 60000);
								const seconds = Math.floor((totalMs % 60000) / 1000);
								const minStr = minutes.toString().padStart(2, "0");
								const secStr = seconds.toString().padStart(2, "0");
								return `[${minStr}:${secStr}] ${line.text}`;
							})
							.join("\n");
						isSynced = true;
					} else if (response.text) {
						lyricsText = response.text;
					}

					if (lyricsText) {
						lyricsProvider = response.providerName || "Lavalink";
						lavalinkSuccess = true;
						client.logger.info(
							`[Lyrics] Successfully retrieved lyrics from Lavalink (${lyricsProvider}).`,
						);
					}
				}
			} catch (err) {
				client.logger.warn(
					`[Lyrics] Lavalink query failed or timed out: ${err instanceof Error ? err.message : err}`,
				);
			}
		}

		if (!lavalinkSuccess && targetTrack) {
			client.logger.info(
				`[Lyrics] Lavalink failed. Trying Musixmatch fallback for: ${songTitle}`,
			);
			const fallbackResult = await fetchMusixmatchFallback(
				ctx,
				targetTrack.info.title ?? "",
				targetTrack.info.author ?? "",
				targetTrack.info.isrc ?? undefined,
			);

			if (fallbackResult) {
				lyricsText = fallbackResult.text || "";
				isSynced = fallbackResult.lines.some(
					(l) => l.timestamp && l.timestamp > 0,
				);
				lyricsProvider = fallbackResult.provider || "Musixmatch";
			}
		}

		if (!lyricsText) {
			client.logger.info(
				`[Lyrics] Lavalink and Musixmatch failed. Trying Genius fallback for: ${songTitle}`,
			);
			try {
				const searches = await geniusClient.songs.search(searchQuery);
				if (searches.length > 0 && searches[0]) {
					const song = searches[0];
					lyricsText = await song.lyrics();
					lyricsProvider = "Genius";
					songTitle = song.title;
					songThumbnail = song.thumbnail;
					songUrl = song.url;
				}
			} catch (err) {
				client.logger.error(
					`[Lyrics] Genius fallback request failed: ${err instanceof Error ? err.message : err}`,
				);
			}
		}

		if (!lyricsText) {
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

		const lyricsChunks = this.splitLyrics(lyricsText);

		const firstEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(
				`${client.config.emoji.list} ${component.lyrics.title({ song: songTitle })}`,
			)
			.setDescription(lyricsChunks[0] || "")
			.setFooter({
				text: `${cmd.requested_by({ user: ctx.author.username })} • ${cmd.powered_by({ provider: lyricsProvider })}${isSynced ? " (Synced)" : ""}`,
				iconUrl: ctx.author.avatarURL(),
			});

		if (songUrl) firstEmbed.setURL(songUrl ?? undefined);
		if (songThumbnail) firstEmbed.setThumbnail(songThumbnail ?? undefined);

		await ctx.editOrReply({ embeds: [firstEmbed] });

		for (let i = 1; i < lyricsChunks.length; i++) {
			const embed = new Embed()
				.setColor(client.config.color.primary)
				.setDescription(lyricsChunks[i] || "");
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
