import type { LyricsResult } from "lavalink-client";
import {
	Button,
	ComponentCommand,
	Container,
	type GuildComponentContext,
	Middlewares,
	Section,
	Separator,
	TextDisplay,
	Thumbnail,
	type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import {
	fetchMusixmatchFallback,
	PlayerSaver,
	updateLyricsEmbed,
} from "#soundy/utils";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkTracks",
])
export default class LyricsEnableComponent extends ComponentCommand {
	override componentType = "Button" as const;
	override customId = "player-lyricsEnable";

	async run(
		ctx: GuildComponentContext<typeof this.componentType>,
	): Promise<void> {
		const { client } = ctx;

		const player = client.manager.getPlayer(ctx.guildId);
		if (!player) return;

		const track = player.queue.current;
		if (!track) return;
		const { cmd, component } = await ctx.getLocale();

		await ctx.deferReply();

		let lyrics: LyricsResult | null =
			player.getData<LyricsResult | undefined>("lyrics") ?? null;

		if (!lyrics) {
			try {
				client.logger.info(
					`[Lyrics Component] Requesting lyrics from Lavalink node for: ${track.info.title}`,
				);
				const lavalinkLyrics = await player.getCurrentLyrics();
				if (
					lavalinkLyrics &&
					(lavalinkLyrics.text ||
						(Array.isArray(lavalinkLyrics.lines) &&
							lavalinkLyrics.lines.length > 0))
				) {
					if (typeof lavalinkLyrics.provider !== "string")
						lavalinkLyrics.provider = "Unknown";
					lavalinkLyrics.provider = lavalinkLyrics.provider
						.replace("Source:", "")
						.trim();
					lyrics = lavalinkLyrics;
					client.logger.info(
						`[Lyrics Component] Successfully retrieved lyrics from Lavalink (${lyrics.provider}).`,
					);
				}
			} catch (err) {
				client.logger.warn(
					`[Lyrics Component] Lavalink query failed: ${err instanceof Error ? err.message : err}`,
				);
			}
		}

		if (!lyrics) {
			client.logger.info(
				`[Lyrics Component] Lavalink failed. Trying Musixmatch fallback for: ${track.info.title}`,
			);
			lyrics = await fetchMusixmatchFallback(
				ctx,
				track.info.title ?? "",
				track.info.author ?? "",
				track.info.isrc ?? undefined,
			);
		}

		if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0)
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: EmbedColors.Red,
						description: `${client.config.emoji.no} ${component.lyrics.no_lyrics}`,
					},
				],
			});

		const lines: string = lyrics.lines
			.slice(0, client.config.lyricsLines)
			.map((l): string => {
				if (!l.line.length) l.line = "...";
				return `-# ${l.line}`;
			})
			.join("\n");

		const components = new Container().addComponents(
			new Section()
				.setAccessory(
					new Thumbnail()
						.setMedia(track.info.artworkUrl ?? "")
						.setDescription(`${track.info.title} - ${track.info.author}`),
				)
				.addComponents(
					new TextDisplay().setContent(
						`# ${String(component.lyrics.title({ song: track.info.title }))}\n\n${lines}\n\n-# ${String(cmd.powered_by({ provider: lyrics.provider }))}`,
					),
				),
			new Separator(),
			new Section()
				.addComponents(
					new TextDisplay().setContent(
						`-# ${String(cmd.requested_by({ user: ctx.author.username }))}`,
					),
				)
				.setAccessory(
					new Button()
						.setCustomId("player-lyricsDisable")
						.setLabel("Close")
						.setStyle(ButtonStyle.Danger),
				),
		);

		const message: WebhookMessage = await ctx.editOrReply(
			{
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		const isEnabled: boolean = !!player.getData<boolean | undefined>(
			"lyricsEnabled",
		);
		if (!isEnabled) {
			await player.subscribeLyrics();

			player.setData("lyricsEnabled", true);
		}

		player.setData("lyrics", lyrics);
		player.setData("lyricsId", message.id);
		player.setData("lyricsRequester", ctx.author);

		const oldInterval = player.getData<NodeJS.Timeout | undefined>(
			"lyricsInterval",
		);
		if (oldInterval) {
			clearInterval(oldInterval);
			player.deleteData("lyricsInterval");
		}

		if (lyrics.provider === "Musixmatch") {
			let lastIndex = -1;
			const intervalId = setInterval(async () => {
				if (
					!player.getData("lyricsEnabled") ||
					player.getData("lyricsId") !== message.id
				) {
					clearInterval(intervalId);
					player.deleteData("lyricsInterval");
					return;
				}

				const currentTrack = player.queue.current;
				if (!currentTrack || currentTrack.info.uri !== track.info.uri) {
					clearInterval(intervalId);
					player.deleteData("lyricsInterval");
					return;
				}

				const currentPosition = player.position;
				let currentIndex = -1;
				for (let i = 0; i < lyrics.lines.length; i++) {
					const l = lyrics.lines[i];
					if (
						l &&
						typeof l.timestamp === "number" &&
						l.timestamp <= currentPosition
					) {
						currentIndex = i;
					} else {
						break;
					}
				}

				if (currentIndex !== lastIndex && currentIndex !== -1) {
					lastIndex = currentIndex;
					await updateLyricsEmbed(client, player, currentTrack, currentIndex);
				}
			}, 1000);

			player.setData("lyricsInterval", intervalId);
		}

		const playerSaver = new PlayerSaver(client.logger);
		await playerSaver.saveLyricsData(ctx.guildId, {
			lyricsEnabled: true,
			lyricsId: message.id,
			lyricsRequester: ctx.author.username,
			lyrics: {
				provider: lyrics.provider,
				text: lyrics.text || undefined,
				lines: lyrics.lines || undefined,
			},
		});
	}
}
