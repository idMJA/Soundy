import {
	Command,
	Declare,
	Embed,
	LocalesT,
	Middlewares,
	Options,
	createStringOption,
	type CommandContext,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import {
	SoundyOptions,
	TimeFormat,
	getAllTopTracks,
	type RecommendationTrack,
} from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

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
				// Remove undefined tracks before shuffling
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

		ctx.deferReply();

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

		player.set("me", {
			...client.me,
			tag: client.me.username,
		});

		if (!player.get("localeString"))
			player.set("localeString", await ctx.getLocaleString());

		if (!player.connected) {
			await player.connect();
		}

		const result = await player.search(query, { requester: ctx.author });

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
					.setDescription(`**[${track.info.title}](${track.info.uri})**`)
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
					.setDescription(`**[${playlistTitle}](${query})**`)
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
