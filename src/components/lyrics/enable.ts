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
import { PlayerSaver } from "#soundy/utils";

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

		const lyrics: LyricsResult | null =
			player.get<LyricsResult | undefined>("lyrics") ??
			(await player
				.getCurrentLyrics()
				.then((lyrics) => {
					if (!lyrics) return null;

					if (typeof lyrics.provider !== "string") lyrics.provider = "Unknown";

					lyrics.provider = lyrics.provider.replace("Source:", "").trim();

					return lyrics;
				})
				.catch(() => null));

		if (!lyrics)
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

		const isEnabled: boolean = !!player.get<boolean | undefined>(
			"lyricsEnabled",
		);
		if (!isEnabled) {
			await player.subscribeLyrics();

			player.set("lyricsEnabled", true);
		}

		player.set("lyrics", lyrics);
		player.set("lyricsId", message.id);
		player.set("lyricsRequester", ctx.author);

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
