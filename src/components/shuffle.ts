import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class ShuffleComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-shuffle";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		// Defer the interaction update immediately and ignore any errors if already deferred
		await ctx.interaction.deferUpdate().catch(() => {});

		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		await player.queue.shuffle();

		await ctx.write({
			embeds: [
				{
					description: `${client.config.emoji.shuffle} ${component.shuffle.description}`,
					color: client.config.color.primary,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
