import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import type {
	APIActionRowComponent,
	APIMessageActionRowComponent,
} from "seyfert/lib/types";
import { ButtonStyle, ComponentType } from "seyfert/lib/types";
import { PlayerSaver } from "#soundy/utils";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class ToggleLoopComponent extends ComponentCommand {
	override componentType = "Button" as const;
	override customId = "player-loop";

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const { component } = await ctx.getLocale();

		// Toggle loop mode: off -> track -> queue -> off
		let newMode: "off" | "track" | "queue";
		if (player.repeatMode === "off") newMode = "track";
		else if (player.repeatMode === "track") newMode = "queue";
		else newMode = "off";
		await player.setRepeatMode(newMode);

		// Save repeatMode to PlayerSaver
		try {
			const playerSaver = new PlayerSaver(client.logger);
			const playerData = player.toJSON();
			playerData.repeatMode = newMode;
			const safeData = playerSaver.extractSafePlayerData(
				playerData as unknown as Record<string, unknown>,
			);
			await playerSaver.savePlayer(player.guildId, safeData);
		} catch (e) {
			client.logger?.error?.("Failed to save repeatMode to PlayerSaver", e);
		}

		// Update the loop button style in-place using ActionRow/Button like pause.ts
		function isLoopButton(comp: unknown): comp is {
			type: number;
			custom_id: string;
			style: ButtonStyle;
			label?: string;
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

		// Only return ActionRow components for Discord message edit, filter out undefined, and cast to correct API type
		const updatedRows = ctx.interaction.message.components
			.map((builder) => {
				const row = builder.toJSON();
				if (
					row.type !== ComponentType.ActionRow ||
					!Array.isArray(row.components)
				)
					return undefined;
				row.components = row.components.map((component) => {
					if (
						isLoopButton(component) &&
						component.custom_id === "player-loop"
					) {
						let style: ButtonStyle;
						if (newMode === "track") style = ButtonStyle.Success;
						else if (newMode === "queue") style = ButtonStyle.Primary;
						else style = ButtonStyle.Secondary;
						return { ...component, style };
					}
					return component;
				});
				return row;
			})
			.filter(
				(row): row is APIActionRowComponent<APIMessageActionRowComponent> =>
					row !== undefined,
			) as APIActionRowComponent<APIMessageActionRowComponent>[];
		await ctx.interaction.message.edit({ components: updatedRows });

		// Respond with the current loop mode
		let currentMode = "";
		switch (newMode) {
			case "off":
				currentMode = component.loop.loop_off;
				break;
			case "track":
				currentMode = component.loop.loop_track;
				break;
			case "queue":
				currentMode = component.loop.loop_queue;
				break;
		}

		await ctx.write({
			embeds: [
				{
					title: `${client.config.emoji.loop} ${component.loop.title}`,
					description: currentMode,
					color: client.config.color.primary,
				},
			],
			flags: 64, // MessageFlags.Ephemeral
		});
	}
}
