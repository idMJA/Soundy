import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";
import { PlayerSaver } from "#soundy/utils";

@Declare({
	name: "autoplay",
	description: "Toggle the autoplay feature",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["auto", "ap"],
})
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Music,
})
@LocalesT("cmd.autoplay.name", "cmd.autoplay.description")
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkTracks",
])
export default class AutoplayCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;

		const { cmd } = await ctx.getLocale();

		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		player.set("enabledAutoplay", !player.get("enabledAutoplay"));

		const isAutoplay = player.get<boolean>("enabledAutoplay");

		// Persist autoplay state
		try {
			const playerSaver = new PlayerSaver(client.logger);
			const playerData = player.toJSON();
			const safeData = playerSaver.extractSafePlayerData(
				playerData as unknown as Record<string, unknown>,
			);
			safeData.enabledAutoplay = isAutoplay;
			await playerSaver.savePlayer(player.guildId, safeData);
		} catch (e) {
			client.logger?.error?.("Failed to save autoplay state to PlayerSaver", e);
		}

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.primary,
					title: `${client.config.emoji.play} ${cmd.autoplay.run.title}`,
					description: isAutoplay
						? cmd.autoplay.run.enabled
						: cmd.autoplay.run.disabled,
				},
			],
		});
	}
}
