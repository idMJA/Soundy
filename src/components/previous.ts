import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class PreviousComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-previous";
	}

	async run(ctx: ComponentContext<typeof this.componentType>) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		const track = await player.queue.shiftPrevious();
		if (!track) {
			await ctx.write({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						title: `${client.config.emoji.warn} ${component.previous.no_previous}`,
						description: `${component.previous.no_previous_description}`,
						color: EmbedColors.Red,
					},
				],
			});
			return;
		}

		await player.queue.add(track, 0);
		await player.play();
		await ctx.write({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					title: `${client.config.emoji.rewind} ${component.previous.title}`,
					description: component.previous.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
