import type { LyricsResult } from "lavalink-client";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "LyricsLine",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track, payload): Promise<void> {
		if (payload.skipped) return;

		if (!player.get<boolean | undefined>("lyricsEnabled")) return;
		if (!player.textChannelId) return;

		const lyricsId = player.get<string | undefined>("lyricsId");
		if (!lyricsId) return;

		const locale = await client.database.getLocale(player.guildId);
		const { cmd } = client.t(locale);

		const message = await client.messages
			.fetch(lyricsId, player.textChannelId)
			.catch(() => null);
		if (!message) return;

		const lyrics = player.get<LyricsResult | undefined>("lyrics");
		if (!lyrics) {
			await message.delete().catch(() => null);

			player.set("lyricsId", undefined);
			player.set("lyrics", undefined);

			return;
		}

		const embed = message.embeds.at(0)?.toBuilder();
		if (!embed) return;

		const totalLines = client.config.lyricsLines + 1;
		const index = payload.lineIndex;

		let start = Math.max(0, index - Math.floor(totalLines / 2));
		if (start + totalLines > lyrics.lines.length)
			start = Math.max(0, lyrics.lines.length - totalLines);

		const end = Math.min(lyrics.lines.length, start + totalLines);

		const lines: string = lyrics.lines
			.slice(start, end)
			.map((l, i): string => {
				if (!l.line.length) l.line = "...";
				return i + start === index ? `**${l.line}**` : `-# ${l.line}`;
			})
			.join("\n");

		const description = `**${track?.info.author ?? "Unknown"}**\n\n${lines}\n\n*${cmd.powered_by({ provider: lyrics.provider })}*`;

		embed.setDescription(description);

		await message.edit({ embeds: [embed] });
	},
});
