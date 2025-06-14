import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class StopComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-stop";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		// Send ephemeral message about stopping
		await ctx.write({
			embeds: [
				{
					title: `${client.config.emoji.stop} ${component.stop.title}`,
					description: component.stop.description,
					color: client.config.color.primary,
				},
			],
			flags: MessageFlags.Ephemeral,
		});

		await player.destroy();
	}
}
