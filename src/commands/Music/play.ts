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
import { MessageFlags } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";
import {
	escapeMarkdown,
	getAllTopTracks,
	type RecommendationTrack,
	SoundyOptions,
	TimeFormat,
} from "#soundy/utils";

const option = {
	query: createStringOption({
		description: "Enter the track name or url.",
		required: true,
		locales: {
			name: "cmd.play.options.query.name",
			description: "cmd.play.options.query.description",
		},
		autocomplete: async (interaction) => {
			const { client, member, guildId } = interaction;
			if (!guildId) return;

			try {
				const { autocomplete } = client.t(
					await client.database.getLocale(guildId),
				);

				if (!client.manager.useable) {
					await interaction
						.respond([
							{
								name: autocomplete.music.no_nodes.toString(),
								value: "noNodes",
							},
						])
						.catch(() => null);
					return;
				}

				const voice = client.cache.voiceStates?.get(member?.id ?? "", guildId);
				if (!voice) {
					await interaction
						.respond([
							{
								name: autocomplete.music.no_voice.toString(),
								value: "noVoice",
							},
						])
						.catch(() => null);
					return;
				}

				const query = interaction.getInput();
				if (!query) {
					try {
						const allTopTracks = await getAllTopTracks();
						const recommendedTracks = allTopTracks.flatMap(
							({ tracks }: { tracks: RecommendationTrack[] }) =>
								tracks.map((track) => `${track.name} ${track.artist}`),
						);

						const selectedQueries = recommendedTracks
							.sort(() => Math.random() - 0.5)
							.slice(0, 5);

						const allTracks = await Promise.all(
							selectedQueries.map(async (trackQuery) => {
								try {
									const { tracks } = await client.manager.search(
										trackQuery,
										client.config.defaultSearchPlatform,
									);
									return tracks.slice(0, 2);
								} catch {
									return [];
								}
							}),
						);

						const flatTracks = allTracks.flat();
						await interaction
							.respond(
								flatTracks
									.filter((t) => Boolean(t?.info?.title && t?.info?.uri))
									.slice(0, 10)
									.map((track) => {
										const duration = track.info.isStream
											? "LIVE"
											: (TimeFormat.toDotted(track.info.duration) ?? "Unknown");
										const title = track.info.title || "Track";
										const author = track.info.author || "Artist";
										const name =
											`${title.slice(0, 40)} (${duration}) - ${author.slice(0, 30)}`.slice(
												0,
												100,
											);
										return {
											name: name || "Track",
											value: (track.info.uri || track.info.title).slice(0, 100),
										};
									}),
							)
							.catch(() => null);
					} catch {
						await interaction.respond([]).catch(() => null);
					}
					return;
				}

				const { tracks } = await client.manager.search(
					query,
					client.config.defaultSearchPlatform,
				);
				if (!tracks.length) {
					await interaction
						.respond([{ name: "No tracks found", value: "noTracks" }])
						.catch(() => null);
					return;
				}

				await interaction
					.respond(
						tracks
							.filter((t) => Boolean(t?.info?.title && t?.info?.uri))
							.slice(0, 25)
							.map((track) => {
								const duration = track.info.isStream
									? "LIVE"
									: (TimeFormat.toDotted(track.info.duration) ?? "Unknown");
								const title = track.info.title || "Track";
								const author = track.info.author || "Artist";
								const name =
									`${title.slice(0, 40)} (${duration}) - ${author.slice(0, 30)}`.slice(
										0,
										100,
									);
								return {
									name: name || "Track",
									value: (track.info.uri || track.info.title).slice(0, 100),
								};
							}),
					)
					.catch(() => null);
			} catch {
				// Silently ignore expired interactions or network drops
			}
		},
	}),
};

@Declare({
	name: "play",
	description: "Play a song or playlist",
	aliases: ["p"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.play.name", "cmd.play.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Options(option)
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkVoicePermissions",
	"checkBotVoiceChannel",
])
export default class PlayCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { client, member, guildId, options } = ctx;
		const { query } = options;

		if (!guildId) return;

		const { event } = await ctx.getLocale();

		const voiceState = await member?.voice();
		if (!voiceState?.channelId) return;

		const player = client.manager.createPlayer({
			guildId,
			voiceChannelId: voiceState.channelId,
			textChannelId: ctx.channelId,
			selfDeaf: true,
			volume: client.config.defaultVolume,
		});

		player.setData("me", {
			...client.me,
			tag: client.me.username,
		});

		if (!player.getData("localeString"))
			player.setData("localeString", await ctx.getLocaleString());

		if (!player.connected) {
			await player.connect();
		}

		const result = await player.search(query, ctx.author);

		switch (result.loadType) {
			case "empty":
			case "error": {
				if (!player.queue.current) await player.destroy();

				await ctx.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${event.music.no_results}`,
						},
					],
				});
				break;
			}
			case "search":
			case "track": {
				const track = result.tracks[0];
				if (!track) return;
				track.requester = ctx.author;
				await player.queue.add(track);

				const status = track.info.isStream
					? "LIVE"
					: (TimeFormat.toDotted(track.info.duration) ?? "Unknown");
				const embed = new Embed()
					.setTitle(`${client.config.emoji.play} ${event.music.added}`)
					.setThumbnail(track.info.artworkUrl ?? undefined)
					.setDescription(
						`**[${escapeMarkdown(track.info.title)}](${track.info.uri})**`,
					)
					.addFields(
						{
							name: `${client.config.emoji.artist} ${event.music.artist}`,
							value: `\`${track.info.author}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.clock} ${event.music.duration}`,
							value: `\`${status}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by}`,
							value: `<@${ctx.author.id}>`,
							inline: true,
						},
					)
					.setColor(client.config.color.primary)
					.setTimestamp();
				await ctx.editOrReply({
					content: "",
					embeds: [embed],
				});
				if (!player.playing) await player.play();
				break;
			}
			case "playlist": {
				for (const t of result.tracks) {
					t.requester = ctx.author;
				}
				await player.queue.add(result.tracks);

				const track = result.tracks[0];
				const playlistTitle =
					result.playlist?.name ??
					result.playlist?.title ??
					(track ? track.info.title : "Playlist");
				const embed = new Embed()
					.setTitle(`${client.config.emoji.play} ${event.music.added_playlist}`)
					.setDescription(`**[${escapeMarkdown(playlistTitle)}](${query})**`)
					.addFields(
						{
							name: `${client.config.emoji.list} ${event.music.tracks}`,
							value: `\`${result.tracks.length}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by}`,
							value: `<@${ctx.author.id}>`,
							inline: true,
						},
					)
					.setColor(client.config.color.primary)
					.setTimestamp();
				await ctx.editOrReply({
					content: "",
					embeds: [embed],
				});
				if (!player.playing) await player.play();
				break;
			}
		}
	}
}
