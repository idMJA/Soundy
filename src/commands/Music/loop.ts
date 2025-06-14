import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { ActionRow, Button } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "loop",
	description: "Toggle the loop mode",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["l"],
})
@LocalesT("cmd.loop.name", "cmd.loop.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class LoopCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const loopRow = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("loop-off")
				.setLabel(component.loop.off)
				.setEmoji("🔁")
				.setStyle(
					player.repeatMode === "off"
						? ButtonStyle.Primary
						: ButtonStyle.Secondary,
				)
				.setDisabled(player.repeatMode === "off"),
			new Button()
				.setCustomId("loop-track")
				.setLabel(component.loop.track)
				.setEmoji("🔂")
				.setStyle(
					player.repeatMode === "track"
						? ButtonStyle.Primary
						: ButtonStyle.Secondary,
				)
				.setDisabled(player.repeatMode === "track"),
			new Button()
				.setCustomId("loop-queue")
				.setLabel(component.loop.queue)
				.setEmoji("📑")
				.setStyle(
					player.repeatMode === "queue"
						? ButtonStyle.Primary
						: ButtonStyle.Secondary,
				)
				.setDisabled(player.repeatMode === "queue"),
		);

		let currentMode = "";
		switch (player.repeatMode) {
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

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.loop} ${component.loop.title}`,
					description: `${currentMode}\n\n${component.loop.description}`,
					color: client.config.color.primary,
				},
			],
			components: [loopRow],
		});
	}
}
