import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class SkipComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-skip";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		const isAutoplay = player.get("enabledAutoplay");
		const hasNextTrack = player.queue.tracks.length > 0;

		await player.skip(undefined, !isAutoplay);

		let description = "";
		if (hasNextTrack) {
			description += component.skip.description;
		} else if (isAutoplay) {
			description += component.skip.autoplay;
		} else {
			description += component.skip.end;
		}

		await ctx.write({
			embeds: [
				{
					title: `${client.config.emoji.skip} ${component.skip.title}`,
					description,
					color: client.config.color.primary,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
