import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class VolumeDownComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-voldown";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		const currentVolume = player.volume;
		const volume = Math.max(0, currentVolume - 10); // Decrease by 10, but not below 0

		await player.setVolume(volume);

		await ctx.write({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					description: `${client.config.emoji.volDown} ${component.volume.description({ volume: `**${volume}%**` })}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
