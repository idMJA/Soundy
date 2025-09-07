import type { LyricsResult } from "lavalink-client";
import {
	Button,
	Container,
	Section,
	Separator,
	TextDisplay,
	Thumbnail,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
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

		const locale = player.get<string>("localeString");
		const { cmd, component } = client.t(locale).get();

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

		if (message.components && message.components.length > 0) {
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
							`-# ${String(cmd.requested_by({ user: player.get<string>("lyricsRequester") || "Unknown" }))}`,
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
			});
		}
	},
});
