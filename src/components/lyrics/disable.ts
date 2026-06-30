import {
	ComponentCommand,
	type GuildComponentContext,
	Middlewares,
} from "seyfert";
import { PlayerSaver } from "#soundy/utils";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkTracks",
])
export default class LyricsDisableComponent extends ComponentCommand {
	override componentType = "Button" as const;
	override customId = "player-lyricsDisable";

	async run(
		ctx: GuildComponentContext<typeof this.componentType>,
	): Promise<void> {
		const { client } = ctx;

		const player = client.manager.getPlayer(ctx.guildId);
		if (!player) return;

		const track = player.queue.current;
		if (!track) return;

		await ctx.deferUpdate();
		await ctx.deleteResponse().catch(() => null);

		const lyricsEnabled = player.getData<boolean | undefined>("lyricsEnabled");
		if (lyricsEnabled) {
			await player.unsubscribeLyrics();
			player.setData("lyricsEnabled", false);
		}

		const intervalId = player.getData<NodeJS.Timeout | undefined>(
			"lyricsInterval",
		);
		if (intervalId) {
			clearInterval(intervalId);
			player.deleteData("lyricsInterval");
		}

		player.deleteData("lyrics");
		player.deleteData("lyricsId");

		const playerSaver = new PlayerSaver(client.logger);
		await playerSaver.clearLyricsData(ctx.guildId);
	}
}
