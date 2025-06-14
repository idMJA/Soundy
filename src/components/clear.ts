import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { PlayerSaver } from "#soundy/utils";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class ClearComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-clear";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		const playerSaver = new PlayerSaver(client.logger);

		player.queue.tracks.splice(0, player.queue.tracks.length);

		await ctx.write({
			embeds: [
				{
					description: `${client.config.emoji.trash} ${component.clear.description}`,
					color: client.config.color.primary,
				},
			],
			flags: MessageFlags.Ephemeral,
		});

		// Save player state using PlayerSaver
		const playerData = player.toJSON();
		const safeData = playerSaver.extractSafePlayerData(
			playerData as unknown as Record<string, unknown>,
		);
		await playerSaver.savePlayer(player.guildId, safeData);
	}
}
