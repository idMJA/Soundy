import { lyricsClient } from "@mjba/lyrics";
import type { LyricsLine, LyricsResult, Player, PluginInfo, Track } from "lavalink-client";
import {
	Button,
	type CommandContext,
	Container,
	type GuildComponentContext,
	Section,
	Separator,
	TextDisplay,
	Thumbnail,
	type User,
	type UsingClient,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

export interface MusixmatchTime {
	minutes: number;
	seconds: number;
	ms: number;
}

export interface MusixmatchSyncedLine {
	time: MusixmatchTime;
	text: string;
}

export interface MusixmatchResponse {
	success: boolean;
	lyrics?: string;
	syncedLyrics?: MusixmatchSyncedLine[];
	hasTimestamps: boolean;
	error?: string;
}

/**
 * Fallback helper function to fetch directly from Musixmatch using @mjba/lyrics.
 * @param ctx The command or component context.
 * @param trackTitle The track title.
 * @param trackArtist The track artist.
 * @param isrc The ISRC code.
 */
export async function fetchMusixmatchFallback(
	ctx: CommandContext | GuildComponentContext<"Button">,
	trackTitle: string,
	trackArtist: string,
	isrc?: string,
): Promise<LyricsResult | null> {
	try {
		if (isrc) {
			ctx.client.logger.info(`Fetching fallback lyrics via ISRC (${isrc}) from Musixmatch...`);
		} else {
			ctx.client.logger.info(`Fetching fallback lyrics via query ("${trackTitle} ${trackArtist}") from Musixmatch...`);
		}

		const response = isrc
			? await lyricsClient.getSynced(isrc)
			: await lyricsClient.searchSynced(`${trackTitle} ${trackArtist}`);

		const result = response as unknown as MusixmatchResponse;

		if (result?.success) {
			let lines: LyricsLine[] = [];
			let plainText = "";

			if (result.hasTimestamps && result.syncedLyrics) {
				lines = result.syncedLyrics.map((lyric) => {
					const totalMs = lyric.time.minutes * 60000 + lyric.time.seconds * 1000 + lyric.time.ms;
					return {
						timestamp: totalMs,
						line: lyric.text || "...",
						duration: 0,
						plugin: {} as unknown as PluginInfo,
					};
				});
				plainText = result.syncedLyrics.map((lyric) => {
					const min = lyric.time.minutes.toString().padStart(2, '0');
					const sec = lyric.time.seconds.toString().padStart(2, '0');
					return `[${min}:${sec}] ${lyric.text}`;
				}).join('\n');
			} else if (result.lyrics) {
				plainText = result.lyrics;
				lines = result.lyrics.split("\n").map((line) => ({
					timestamp: 0,
					line: line || "...",
					duration: 0,
					plugin: {} as unknown as PluginInfo,
				}));
			}

			if (plainText || lines.length > 0) {
				return {
					provider: "Musixmatch",
					text: plainText,
					lines,
					sourceName: "musixmatch",
					plugin: {} as unknown as PluginInfo,
				};
			}
		}
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : String(e);
		ctx.client.logger.error(`Failed to fetch fallback lyrics from Musixmatch: ${errorMessage}`);
	}
	return null;
}

/**
 * Shared function to update the lyrics embed message with scrolling/bolding.
 */
export async function updateLyricsEmbed(
	client: UsingClient,
	player: Player,
	track: Track,
	index: number,
): Promise<void> {
	try {
		if (!player.getData("lyricsEnabled")) return;
		if (!player.textChannelId) return;

		const lyricsId = player.getData<string | undefined>("lyricsId");
		if (!lyricsId) return;

		const lyrics = player.getData<LyricsResult | undefined>("lyrics");
		if (!lyrics) return;

		const message = await client.messages
			.fetch(lyricsId, player.textChannelId)
			.catch(() => null);
		if (!message) return;

		const locale = player.getData<string | undefined>("localeString") || "en-US";
		const { cmd, component } = client.t(locale).get();

		const totalLines = client.config.lyricsLines + 1;

		let start = Math.max(0, index - Math.floor(totalLines / 2));
		if (start + totalLines > lyrics.lines.length)
			start = Math.max(0, lyrics.lines.length - totalLines);

		const end = Math.min(lyrics.lines.length, start + totalLines);

		const lines: string = lyrics.lines
			.slice(start, end)
			.map((l, i): string => {
				const lineText = l.line || "...";
				return i + start === index ? `**${lineText}**` : `-# ${lineText}`;
			})
			.join("\n");

		const components = new Container().addComponents(
			new Section()
				.setAccessory(
					new Thumbnail()
						.setMedia(track?.info.artworkUrl ?? "")
						.setDescription(`${track?.info.title} - ${track?.info.author}`),
				)
				.addComponents(
					new TextDisplay().setContent(
						`# ${String(
							component.lyrics.title({
								song: track?.info.title ?? "Unknown Title",
							}),
						)}\n\n${lines}\n\n-# ${String(cmd.powered_by({ provider: lyrics.provider }))}`,
					),
				),
			new Separator(),
			new Section()
				.addComponents(
					new TextDisplay().setContent(
						`-# ${String(cmd.requested_by({ user: player.getData<User | undefined>("lyricsRequester")?.username || player.getData("lyricsRequester") || "Unknown" }))}`,
					),
				)
				.setAccessory(
					new Button()
						.setCustomId("player-lyricsDisable")
						.setLabel("Close")
						.setStyle(ButtonStyle.Danger),
				),
		);

		await message.edit({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		}).catch(() => null);
	} catch (err) {
		client.logger.error(`Error updating lyrics embed: ${err instanceof Error ? err.message : err}`);
	}
}
