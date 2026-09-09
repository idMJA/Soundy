import { lyricsClient } from "@mjba/lyrics";
import type {
	LyricsLine,
	LyricsResult,
	Player,
	PluginInfo,
	Track,
} from "lavalink-client";
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

import ky, { type HTTPError } from "ky";

export interface LrclibResponse {
	id?: number;
	name?: string;
	trackName?: string;
	artistName?: string;
	albumName?: string;
	duration?: number;
	instrumental?: boolean;
	plainLyrics?: string;
	syncedLyrics?: string;
}

/**
 * Fetch lyrics from LRCLIB.
 * @param ctx The command or component context.
 * @param trackTitle The title of the track.
 * @param trackArtist The artist of the track.
 * @param durationMs Optional duration in milliseconds for exact matching.
 */
export async function fetchLrclibFallback(
	ctx: CommandContext | GuildComponentContext<"Button">,
	trackTitle: string,
	trackArtist: string,
	durationMs?: number,
): Promise<LyricsResult | null> {
	const logger = ctx.client.logger;
	const userAgent = "Soundy/3.6.0 (https://github.com/idMJA/Soundy)";
	const timeout = 3500;

	const parseLrclibResult = (res: LrclibResponse): LyricsResult | null => {
		if (res.syncedLyrics && res.syncedLyrics.trim().length > 0) {
			const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;
			const lines: LyricsLine[] = [];
			const plainLines: string[] = [];

			for (const rawLine of res.syncedLyrics.split("\n")) {
				const trimmed = rawLine.trim();
				const match = trimmed.match(regex);
				if (match?.[1] && match[2] && match[3]) {
					const minStr = match[1];
					const secStr = match[2];
					const msStr = match[3];
					const min = parseInt(minStr, 10);
					const sec = parseInt(secStr, 10);
					const ms =
						msStr.length === 2 ? parseInt(msStr, 10) * 10 : parseInt(msStr, 10);
					const timestamp = min * 60000 + sec * 1000 + ms;
					const text = match[4] || "";

					lines.push({
						timestamp,
						line: text || "...",
						duration: 0,
						plugin: {} as unknown as PluginInfo,
					});
					plainLines.push(`[${match[1]}:${match[2]}] ${text}`);
				}
			}

			if (lines.length > 0) {
				return {
					provider: "LRCLIB",
					text: plainLines.join("\n"),
					lines,
					sourceName: "lrclib",
					plugin: {} as unknown as PluginInfo,
				};
			}
		}

		if (res.plainLyrics && res.plainLyrics.trim().length > 0) {
			const lines = res.plainLyrics.split("\n").map((line) => ({
				timestamp: 0,
				line: line || "...",
				duration: 0,
				plugin: {} as unknown as PluginInfo,
			}));

			return {
				provider: "LRCLIB",
				text: res.plainLyrics,
				lines,
				sourceName: "lrclib",
				plugin: {} as unknown as PluginInfo,
			};
		}

		return null;
	};

	try {
		logger.info(
			`[Lyrics] Fetching fallback lyrics from LRCLIB for: "${trackTitle}" by "${trackArtist}"`,
		);

		const searchParams: Record<string, string | number> = {
			track_name: trackTitle,
			artist_name: trackArtist,
		};
		if (durationMs && durationMs > 0) {
			searchParams.duration = Math.round(durationMs / 1000);
		}

		try {
			const res = await ky
				.get("https://lrclib.net/api/get", {
					searchParams,
					timeout,
					headers: { "User-Agent": userAgent },
				})
				.json<LrclibResponse>();

			const parsed = parseLrclibResult(res);
			if (parsed) return parsed;
		} catch (getErr) {
			const status = (getErr as HTTPError)?.response?.status;
			if (status !== 404) {
				logger.warn(
					`[Lyrics] LRCLIB get error: ${getErr instanceof Error ? getErr.message : getErr}`,
				);
			}
		}

		if (searchParams.duration) {
			delete searchParams.duration;
			try {
				const res = await ky
					.get("https://lrclib.net/api/get", {
						searchParams,
						timeout,
						headers: { "User-Agent": userAgent },
					})
					.json<LrclibResponse>();

				const parsed = parseLrclibResult(res);
				if (parsed) return parsed;
			} catch (retryErr) {
				const status = (retryErr as HTTPError)?.response?.status;
				if (status !== 404) {
					logger.warn(
						`[Lyrics] LRCLIB get (no duration) error: ${retryErr instanceof Error ? retryErr.message : retryErr}`,
					);
				}
			}
		}

		try {
			const searchRes = await ky
				.get("https://lrclib.net/api/search", {
					searchParams: {
						q: `${trackTitle} ${trackArtist}`.trim(),
					},
					timeout,
					headers: { "User-Agent": userAgent },
				})
				.json<LrclibResponse[]>();

			if (Array.isArray(searchRes) && searchRes.length > 0) {
				const withSynced = searchRes.find(
					(item) => item.syncedLyrics && item.syncedLyrics.trim().length > 0,
				);
				const candidate = withSynced || searchRes[0];
				if (candidate) {
					const parsed = parseLrclibResult(candidate);
					if (parsed) return parsed;
				}
			}
		} catch (searchErr) {
			logger.warn(
				`[Lyrics] LRCLIB search error: ${searchErr instanceof Error ? searchErr.message : searchErr}`,
			);
		}
	} catch (e) {
		logger.error(
			`[Lyrics] Failed to fetch from LRCLIB: ${e instanceof Error ? e.message : e}`,
		);
	}

	return null;
}

/**
 * Fetch lyrics from Musixmatch.
 * @param ctx The command or component context.
 * @param trackTitle The title of the track.
 * @param trackArtist The artist of the track.
 * @param isrc Optional ISRC code of the track.
 */
export async function fetchMusixmatchFallback(
	ctx: CommandContext | GuildComponentContext<"Button">,
	trackTitle: string,
	trackArtist: string,
	isrc?: string,
): Promise<LyricsResult | null> {
	try {
		if (isrc) {
			ctx.client.logger.info(
				`Fetching fallback lyrics via ISRC (${isrc}) from Musixmatch...`,
			);
		} else {
			ctx.client.logger.info(
				`Fetching fallback lyrics via query ("${trackTitle} ${trackArtist}") from Musixmatch...`,
			);
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
					const totalMs =
						lyric.time.minutes * 60000 +
						lyric.time.seconds * 1000 +
						lyric.time.ms;
					return {
						timestamp: totalMs,
						line: lyric.text || "...",
						duration: 0,
						plugin: {} as unknown as PluginInfo,
					};
				});
				plainText = result.syncedLyrics
					.map((lyric) => {
						const min = lyric.time.minutes.toString().padStart(2, "0");
						const sec = lyric.time.seconds.toString().padStart(2, "0");
						return `[${min}:${sec}] ${lyric.text}`;
					})
					.join("\n");
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
		ctx.client.logger.error(
			`Failed to fetch fallback lyrics from Musixmatch: ${errorMessage}`,
		);
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

		const locale =
			player.getData<string | undefined>("localeString") || "en-US";
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

		await message
			.edit({
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			})
			.catch(() => null);
	} catch (err) {
		client.logger.error(
			`Error updating lyrics embed: ${err instanceof Error ? err.message : err}`,
		);
	}
}
