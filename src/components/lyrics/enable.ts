import type { LyricsResult } from "lavalink-client";
import {
	ActionRow,
	Button,
	ComponentCommand,
	Embed,
	type GuildComponentContext,
	Middlewares,
	type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import { EmbedPaginator, PlayerSaver } from "#soundy/utils";

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

		if (!Array.isArray(lyrics.lines)) {
			if (!lyrics.text)
				return ctx.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							color: EmbedColors.Red,
							description: `${client.config.emoji.no} ${component.lyrics.no_lyrics}`,
						},
					],
				});

			const paginator = new EmbedPaginator(ctx);
			const lines = lyrics.text.split("\n");

			for (let i = 0; i < lines.length; i += client.config.lyricsLines) {
				paginator.addEmbed(
					new Embed()
						.setThumbnail(track.info.artworkUrl ?? undefined)
						.setColor(client.config.color.primary)
						.setTitle(
							`${client.config.emoji.list} ${component.lyrics.title({ song: track.info.title })}`,
						)
						.setFooter({
							iconUrl: ctx.author.avatarURL(),
							text: cmd.requested_by({ user: ctx.author.username }),
						})
						.setDescription(
							`**${track.info.author}**\n\n${lines.slice(i, i + client.config.lyricsLines).join("\n")}\n\n${cmd.powered_by({ provider: lyrics.provider })}`,
						),
				);
			}

			await paginator.reply();

			return;
		}

		const lines: string = lyrics.lines
			.slice(0, client.config.lyricsLines)
			.map((l): string => {
				if (!l.line.length) l.line = "...";
				return `-# ${l.line}`;
			})
			.join("\n");

		const embed = new Embed()
			.setThumbnail(track.info.artworkUrl ?? undefined)
			.setColor(client.config.color.primary)
			.setTitle(
				`${client.config.emoji.list} ${component.lyrics.title({ song: track.info.title })}`,
			)
			.setFooter({
				iconUrl: ctx.author.avatarURL(),
				text: cmd.requested_by({ user: ctx.author.username }),
			})
			.setDescription(
				`**${track.info.author}**\n\n${lines}\n\n${cmd.powered_by({ provider: lyrics.provider })}`,
			);

		const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("player-lyricsDisable")
				.setLabel("Close")
				.setStyle(ButtonStyle.Danger),
		);

		const message: WebhookMessage = await ctx.editOrReply(
			{ embeds: [embed], components: [row] },
			true,
		);

		// subscribe to lyrics if not already enabled
		const isEnabled: boolean = !!player.get<boolean | undefined>(
			"lyricsEnabled",
		);
		if (!isEnabled) {
			await player.subscribeLyrics();

			player.set("lyricsEnabled", true);
		}

		player.set("lyrics", lyrics);
		player.set("lyricsId", message.id);

		const playerSaver = new PlayerSaver(client.logger);
		await playerSaver.saveLyricsData(ctx.guildId, {
			lyricsEnabled: true,
			lyricsId: message.id,
			lyrics: {
				provider: lyrics.provider,
				text: lyrics.text || undefined,
				lines: lyrics.lines || undefined,
			},
		});
	}
}
