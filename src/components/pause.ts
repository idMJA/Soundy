import {
	ActionRow,
	type Button,
	ComponentCommand,
	type ComponentContext,
	Middlewares,
} from "seyfert";
import { ButtonStyle, ComponentType, MessageFlags } from "seyfert/lib/types";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class PauseComponent extends ComponentCommand {
	override componentType = "Button" as const;
	override customId = "player-pause";

	async run(ctx: ComponentContext<typeof this.componentType>) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { event } = await ctx.getLocale();

		const state = player.paused ? "resume" : "pause";
		await player[state]();

		// Update the pause button to play or pause icon and style
		function isPauseButton(comp: unknown): comp is {
			type: number;
			custom_id: string;
			label?: string;
			style: ButtonStyle;
			emoji?: { name?: string; id?: string; animated?: boolean } | string;
		} {
			return (
				typeof comp === "object" &&
				comp !== null &&
				(comp as { type?: number }).type === ComponentType.Button &&
				typeof (comp as { custom_id?: string }).custom_id === "string" &&
				typeof (comp as { style?: number }).style === "number"
			);
		}

		const updatedRows = ctx.interaction.message.components.map((builder) => {
			const row = builder.toJSON();
			if (
				row.type !== ComponentType.ActionRow ||
				!Array.isArray(row.components)
			)
				return builder;
			return new ActionRow<Button>({
				components: row.components.map((component) => {
					if (
						isPauseButton(component) &&
						component.custom_id === "player-pauseTrack"
					) {
						// Set emoji as { name, id } if using custom emoji, or as string for unicode
						const emoji = player.paused
							? client.config.emoji.play
							: client.config.emoji.pause;
						if (
							typeof emoji === "string" &&
							emoji.startsWith("<:") &&
							emoji.includes(":")
						) {
							// Parse custom emoji string: <a:name:id> or <:name:id>
							const match = emoji.match(/<?a?:?(\w+):(\d+)>?/);
							if (match) {
								component.emoji = { name: match[1], id: match[2] };
							} else {
								component.emoji = undefined;
							}
						} else {
							// If it's a unicode emoji, set as { name }
							component.emoji =
								typeof emoji === "string" ? { name: emoji } : undefined;
						}
						component.style = player.paused
							? ButtonStyle.Success
							: ButtonStyle.Secondary;
					}
					return component;
				}),
			});
		});

		await ctx.interaction.message.edit({
			components: updatedRows as ActionRow<Button>[],
		});

		await ctx.write({
			embeds: [
				{
					color: client.config.color.primary,
					title: player.paused
						? `${client.config.emoji.pause} ${event.music.pause.title}`
						: `${client.config.emoji.play} ${event.music.resume.title}`,
					description: player.paused
						? event.music.pause.description
						: event.music.resume.description,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
